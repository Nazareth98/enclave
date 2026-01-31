// src/config/app-config.module.ts
import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AppConfigModule {}

/***
 * Como utilizar
 *
 *
 * -- Dentro do seu WsJwtGuard ou ChatGateway
 * constructor(private jwtService: JwtService) {} // O Nest injetará a versão configurada com a Secret do .env
 */
