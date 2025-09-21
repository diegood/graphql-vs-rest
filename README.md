# GraphQL vs REST Demo (Fastify + Postgres)

This repo spins up:
- **Postgres 16** (ephemeral, auto-seeded)
- **REST API** on `http://localhost:3000`
- **GraphQL API (Fastify + mercurius)** on `http://localhost:4000/graphiql`

## Run

```bash
docker compose up --build
```

The DB is seeded automatically from `db/init.sql`. Because we do **not** use a volume,
dropping the containers resets the data.

```bash
docker compose down
```

## REST endpoints

- `GET /health`
- `GET /usuarios/:id`
- `GET /usuarios/:id/pedidos?limit=2`

## GraphQL

Open GraphiQL at `http://localhost:4000/graphiql` and try:

```graphql
{
  usuario(id: 1) {
    nombre
    email
    amigos { id nombre }
    pedidos(limit: 2) {
      id total estado
      items { cantidad producto { nombre precio } }
      pago { metodo detalles }
    }
  }
}
```

Mutation:

```graphql
mutation Crear($input: CrearPedidoInput!) {
  crearPedido(input: $input) {
    id total estado
  }
}
```

Variables:

```json
{
  "input": {
    "usuarioId": 1,
    "items": [
      { "productoId": 2, "cantidad": 2 },
      { "productoId": 3, "cantidad": 1 }
    ],
    "pago": { "metodo": "tarjeta", "detalles": { "tarjeta": "**** **** **** 9999", "exp": "11/28" } }
  }
}
```
