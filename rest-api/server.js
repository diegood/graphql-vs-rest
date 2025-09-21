import Fastify from 'fastify';
import { query } from './db.js';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true }));

// GET /usuarios/:id
app.get('/usuarios/:id', async (req, reply) => {
  const { id } = req.params;
  const rows = await query('SELECT * FROM usuarios WHERE id=$1', [id]);
  if (!rows[0]) return reply.code(404).send({ error: 'Usuario no encontrado' });

  // Eager-load amigos to emulate overfetching in REST
  const amigos = await query(
    'SELECT u.id, u.nombre FROM amigos a JOIN usuarios u ON u.id=a.amigo_id WHERE a.usuario_id=$1',
    [id]
  );
  const usuario = rows[0];
  usuario.amigos = amigos;

  reply.send(usuario);
});

// GET /usuarios/:id/pedidos?limit=2
app.get('/usuarios/:id/pedidos', async (req, reply) => {
  const { id } = req.params;
  const limit = Number(req.query.limit || 10);

  const pedidos = await query(
    'SELECT * FROM pedidos WHERE usuario_id=$1 ORDER BY fecha DESC LIMIT $2',
    [id, limit]
  );

  // Enriquecer cada pedido con items, productos y pago (clásico N+1 en REST)
  for (const p of pedidos) {
    p.items = await query(
      'SELECT i.cantidad, pr.* FROM items_pedido i JOIN productos pr ON pr.id=i.producto_id WHERE i.pedido_id=$1',
      [p.id]
    );
    const pagos = await query('SELECT metodo, detalles FROM pagos WHERE pedido_id=$1', [p.id]);
    p.pago = pagos[0] || null;
  }

  reply.send(pedidos);
});

const PORT = Number(process.env.PORT || 3000);
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => console.log(`REST API on http://localhost:${PORT}`))
  .catch(err => { console.error(err); process.exit(1); });
