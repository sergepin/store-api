import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Fix for BigInt serialization: JSON.stringify doesn't know how to handle BigInt
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Escuchamos en 0.0.0.0 para que Docker pueda rutear el trafico fuera del contenedor
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
