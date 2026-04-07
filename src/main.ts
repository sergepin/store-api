import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Escuchamos en 0.0.0.0 para que Docker pueda rutear el trafico fuera del contenedor
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
