import Fastify from 'fastify';
import { query } from './db.js';
import mercurius, { gql } from 'mercurius';

import GraphQLJSON from 'graphql-type-json';

const { PubSub } = mercurius;
const pubsub = new PubSub();

const app = Fastify({ logger: true });

const schema = gql`
  scalar JSON

  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    edad: Int
    activo: Boolean
    avatar: String
    amigos: [Usuario!]!
    pedidos(limit: Int = 10, offset: Int = 0): [Pedido!]!
  }
  type Producto { id: ID!, nombre: String!, precio: Float! }
  type ItemPedido { id: ID!, cantidad: Int!, producto: Producto }
  type Pago { metodo: String!, detalles: JSON }
  type Pedido {
    id: ID!
    fecha: String
    total: Float!
    estado: String!
    items: [ItemPedido!]!
    pago: Pago
    usuario: Usuario
  }


  input ItemInput { productoId: ID!, cantidad: Int! }
  input PagoInput { metodo: String!, detalles: JSON }
  input CrearPedidoInput { usuarioId: ID!, items: [ItemInput!]!, pago: PagoInput! }

  type Query {
    usuario(id: ID!): Usuario
    pedidos(estado: String, limit: Int = 10, offset: Int = 0): [Pedido!]!
  }

  type Mutation {
    crearPedido(input: CrearPedidoInput!): Pedido!
    agregarAmigo(usuarioId: ID!, amigoId: ID!): Usuario!
  }

  type Subscription {
    nuevoPedido: Pedido!
  }
`;

const resolvers = {
  JSON: GraphQLJSON,


  Subscription: {
    nuevoPedido: {
        subscribe: async (_, __, { pubsub }) => pubsub.subscribe('NUEVO_PEDIDO'),
        resolve: (payload) => payload
    },
  },

  Query: {
    usuario: async (_, { id }) =>
      (await query('SELECT * FROM usuarios WHERE id=$1', [id]))[0] || null,
    pedidos: async (_, { estado, limit, offset }) => {
      const clauses = [];
      const params = [];
      if (estado) { params.push(estado); clauses.push(`estado=$${params.length}`); }
      params.push(limit, offset);
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      return await query(
        `SELECT * FROM pedidos ${where} ORDER BY fecha DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
        params
      );
    }
  },

  Usuario: {
    amigos: async (parent) =>
      await query(
        'SELECT u.id, u.nombre, u.email, u.edad, u.activo, u.avatar FROM amigos a JOIN usuarios u ON u.id=a.amigo_id WHERE a.usuario_id=$1',
        [parent.id]
      ),
    pedidos: async (parent, { limit, offset }) =>
      await query(
        'SELECT * FROM pedidos WHERE usuario_id=$1 ORDER BY fecha DESC LIMIT $2 OFFSET $3',
        [parent.id, limit, offset]
      )
  },

  Pedido: {
    items: async (parent) =>
      (await query(
        'SELECT i.id, i.cantidad, pr.id as producto_id, pr.nombre, pr.precio FROM items_pedido i JOIN productos pr ON pr.id=i.producto_id WHERE i.pedido_id=$1',
        [parent.id]
      )).map(r => ({
        id: r.id,
        cantidad: r.cantidad,
        producto: { id: r.producto_id, nombre: r.nombre, precio: Number(r.precio) }
      })),
    pago: async (parent) =>
      (await query('SELECT metodo, detalles FROM pagos WHERE pedido_id=$1', [parent.id]))[0] || null,
    usuario: async (parent) =>
      (await query('SELECT * FROM usuarios WHERE id=$1', [parent.usuario_id]))[0] || null
  },

  Mutation: {
    crearPedido: async (_, { input }) => {
      const { usuarioId, items, pago } = input;
      const productIds = items.map(i => Number(i.productoId));
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
      const products = productIds.length
        ? await query(`SELECT id, precio FROM productos WHERE id IN (${placeholders})`, productIds)
        : [];
      const priceMap = new Map(products.map(p => [Number(p.id), Number(p.precio)]));

      let total = 0;
      for (const it of items) {
        const price = priceMap.get(Number(it.productoId)) || 0;
        total += price * Number(it.cantidad);
      }

      const [pedido] = await query(
        'INSERT INTO pedidos (usuario_id, total, estado) VALUES ($1, $2, $3) RETURNING *',
        [usuarioId, total, 'procesando']
      );

      for (const it of items) {
        await query(
          'INSERT INTO items_pedido (pedido_id, producto_id, cantidad) VALUES ($1, $2, $3)',
          [pedido.id, it.productoId, it.cantidad]
        );
      }

      await query(
        'INSERT INTO pagos (pedido_id, metodo, detalles) VALUES ($1, $2, $3)',
        [pedido.id, pago.metodo, pago.detalles || {}]
      );
      await pubsub.publish({ topic: 'NUEVO_PEDIDO', payload: pedido });
      return pedido;
    },

    agregarAmigo: async (_, { usuarioId, amigoId }) => {
      await query(
        'INSERT INTO amigos (usuario_id, amigo_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [usuarioId, amigoId]
      );
      return (await query('SELECT * FROM usuarios WHERE id=$1', [usuarioId]))[0];
    }
  }
};

app.register(mercurius, { schema, resolvers, graphiql: true });

app.get('/health', async () => ({ ok: true }));

const PORT = Number(process.env.PORT || 4000);
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => console.log(`GraphQL on http://localhost:${PORT}/graphiql`))
  .catch(err => { console.error(err); process.exit(1); });
