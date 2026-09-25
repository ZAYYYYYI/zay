import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as careCardsApi from "@client/src/api/care-cards";
import type { CareCard } from "@shared/api.interface";
import { Image } from '@client/src/components/ui/image';

const CareCardsPage = () => {
  const [cards, setCards] = useState<CareCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    careCardsApi
      .listCards(1, 20)
      .then((res: { items: CareCard[]; total: number }) => {
        setCards(res.items);
      })
      .catch(() => {
        setError(true);
        toast.error("加载失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">专属养护卡</h1>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500">加载失败</p>
        </div>
      )}

      {!loading && !error && cards.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <p className="text-gray-500">
            暂无养护卡，请先进行植物检测
          </p>
        </div>
      )}

      {!loading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: CareCard) => (
            <Link
              key={card.id}
              to={`/care-cards/${card.id}`}
              className="border rounded-xl p-6 hover:border-primary hover:shadow-sm transition cursor-pointer block"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {card.plantIconUrl ? (
                    <Image
                      src={card.plantIconUrl}
                      alt={card.plantSpecies}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Leaf className="w-5 h-5 text-primary" />
                  )}
                </div>
                <h3 className="text-base font-medium text-gray-900">
                  {card.plantSpecies}
                </h3>
              </div>

              <div className="space-y-1.5 mb-3">
                {card.wateringGuide && (
                  <p className="text-xs text-gray-500">
                    浇水：{card.wateringGuide.slice(0, 60)}
                    {card.wateringGuide.length > 60 ? "..." : ""}
                  </p>
                )}
                {card.lightingGuide && (
                  <p className="text-xs text-gray-500">
                    光照：{card.lightingGuide.slice(0, 60)}
                    {card.lightingGuide.length > 60 ? "..." : ""}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-400">
                {new Date(card.createdAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareCardsPage;