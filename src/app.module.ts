import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { ChatModule } from "./modules/chat/chat.module";
import { AppConfigModule } from "./config/app-config.module";

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule, GroupsModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
