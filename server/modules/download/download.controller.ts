import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { createReadStream } from "fs";
import { join } from "path";

@Controller("api/download")
export class DownloadController {
  @Get("source")
  downloadSource(@Res() res: Response) {
    const zipPath = join(process.cwd(), "client/public/miaozhi-github.zip");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="miaozhi-source.zip"',
    );
    const stream = createReadStream(zipPath);
    stream.pipe(res);
  }
}