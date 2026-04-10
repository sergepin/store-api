import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── 🌐 CORS CONFIGURATION ─────────────────────────────────────────────
  app.enableCors({
    origin: true, // During development, we allow all origins.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── 📝 SWAGGER CONFIGURATION ─────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Store API')
    .setDescription('The Store API description with Multi-tenancy support')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      name: 'x-tenant-slug',
      in: 'header',
      required: false,
      description: 'Tenant Slug for multi-tenancy (e.g., gamer-store)',
      schema: { type: 'string' },
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
