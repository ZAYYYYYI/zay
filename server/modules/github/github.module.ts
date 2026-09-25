import { Module } from "@nestjs/common";
import { GithubController } from "./github.controller";
import { MiaodaConnectionsModule } from "@lark-apaas/miaoda-connections-sdk";

@Module({
  imports: [MiaodaConnectionsModule],
  controllers: [GithubController],
})
export class GithubModule {}