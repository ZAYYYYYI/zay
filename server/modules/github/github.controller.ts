import { Controller, Get, Query } from "@nestjs/common";
import { ConnectionsService } from "@lark-apaas/miaoda-connections-sdk";

@Controller("api/github")
export class GithubController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get("token")
  async getToken(@Query("name") name: string) {
    const connection = await this.connections.getConnection({
      connectionName: name,
    });
    if (connection.state !== "connected") {
      return { ok: false, state: connection.state, hint: connection.recoveryHint };
    }
    if (connection.value.type === "oauth2") {
      return { ok: true, token: connection.value.accessToken };
    }
    return { ok: false, type: connection.value.type };
  }
}