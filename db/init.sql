
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  edad INT,
  activo BOOLEAN DEFAULT true,
  avatar TEXT
);

CREATE TABLE amigos (
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  amigo_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, amigo_id)
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio NUMERIC(10,2) NOT NULL
);

CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  total NUMERIC(10,2) NOT NULL,
  estado VARCHAR(20) NOT NULL
);

CREATE TABLE items_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id),
  cantidad INT NOT NULL
);

CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  pedido_id INT UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
  metodo VARCHAR(20) NOT NULL,
  detalles JSONB
);

--gracias ChatGPT por hacerme los datos de prueba
INSERT INTO usuarios (nombre, email, edad, avatar) VALUES
('Ana', 'ana@mail.com', 30, 'https://www.gravatar.com/avatar/42?d=wavatar&f=y&s=128'),
('Luis', 'luis@mail.com', 28, 'https://www.gravatar.com/avatar/43?d=wavatar&f=y&s=128'),
('Marta', 'marta@mail.com', 35, 'https://www.gravatar.com/avatar/44?d=wavatar&f=y&s=128');

INSERT INTO amigos (usuario_id, amigo_id) VALUES
(1,2),(1,3),(2,3);

INSERT INTO productos (nombre, precio) VALUES
('Laptop', 1200.00),
('Mouse', 25.00),
('Teclado', 75.00);

INSERT INTO pedidos (usuario_id, fecha, total, estado) VALUES
(1, '2024-06-01 10:00:00', 50.00, 'entregado'),
(1, '2024-06-15 15:30:00', 75.00, 'enviado'),
(2, '2024-06-20 09:00:00', 1200.00, 'procesando');

INSERT INTO items_pedido (pedido_id, producto_id, cantidad) VALUES
(1, 2, 2), -- Ana - 2 Mouses
(2, 3, 1), -- Ana - 1 Teclado
(3, 1, 1); -- Luis - 1 Laptop

INSERT INTO pagos (pedido_id, metodo, detalles) VALUES
(1, 'tarjeta', '{"tarjeta":"**** **** **** 1234","exp":"12/26"}'),
(2, 'paypal', '{"cuenta":"ana_paypal_42"}'),
(3, 'tarjeta', '{"tarjeta":"**** **** **** 5678","exp":"09/27"}');
