comenzar con el concepto de resolvers

explicando los resolvers

explicar los resolvers de tipos
  - tipos de datos
    - scalars
    - objetos
    - enumeraciones

explicar los resolvers de queries
  mostrar ejemplos de queries
    - query de usuario
    ```graphql
      query usuarioquery{
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
    - mostrar underfetching con query de productos y agrego solo productos
      ```graphql
          producto {
            id nombre precio
          }
      ```

explicar los resolvers de mutations
 - mutation al igual que query y subscription tienen su propio resolver aparte devuelve un objeto con el nuevo estado segun el tipo de dato, en rest esto se suele hacer con un post
   - crear pedido
     ```graphql
       mutation crearPedido {
         crearPedido(
           input: {
             usuarioId: 1
             items: [
               { productoId: 1, cantidad: 2 },
               { productoId: 2, cantidad: 1 }
             ]
             pago: { metodo: "tarjeta", detalles: { tarjeta: "**** **** **** 1234", exp: "12/26" } }
           }
         ) {
           id
           total
           estado
           items {
             cantidad
             producto { nombre precio }
           }
           pago { metodo detalles }
         }
       }
     ```
     - alternativa con variables
       ```graphql
         mutation CrearPedido($input: CrearPedidoInput!) {
            crearPedido(input: $input) { id total estado }
          }
        ```
      - variables
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

explicar los resolvers de subscriptions
  - para esto abrir otra pestaña y mostrar el schema de subscriptions
  ```graphql
    subscription {
      nuevoPedido {
        id
        total
        estado
        items { cantidad producto { nombre precio } }
        pago { metodo detalles }
      }
    }
  ```


