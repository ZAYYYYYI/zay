import { useEffect } from "react";
import { Download, FileArchive } from "lucide-react";
import { Button } from "@client/src/components/ui/button";
import { resolveAppUrl } from "@lark-apaas/client-toolkit/utils/resolveAppUrl";

const downloadZip = () => {
  const url = resolveAppUrl("/api/download/source");
  const win = window.open(url, "_blank");
  if (win) {
    setTimeout(() => win.close(), 3000);
  }
};

const GitHubDownload = () => {
  useEffect(() => {
    downloadZip();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileArchive className="h-16 w-16 text-primary mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        正在开始下载…
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        若未自动开始，请点击下方按钮
      </p>
      <Button className="gap-2" onClick={downloadZip}>
        <Download className="h-4 w-4" />
        下载 GitHub 源码压缩包
      </Button>
    </div>
  );
};

export default GitHubDownload;