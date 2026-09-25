import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Droplets,
  Sun,
  Leaf,
  Thermometer,
  FileText,
  Loader2,
} from "lucide-react";
import * as careCardsApi from "@client/src/api/care-cards";
import type { CareCard } from "@shared/api.interface";

const sectionConfig = [
  { label: "浇水指南", icon: Droplets, iconColor: "text-blue-500", field: "wateringGuide" as const },
  { label: "光照指南", icon: Sun, iconColor: "text-amber-500", field: "lightingGuide" as const },
  { label: "施肥指南", icon: Leaf, iconColor: "text-primary", field: "fertilizingGuide" as const },
  { label: "温度指南", icon: Thermometer, iconColor: "text-orange-500", field: "temperatureGuide" as const },
  { label: "备注", icon: FileText, iconColor: "text-gray-400", field: "notes" as const },
];

const CareCardDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<CareCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    careCardsApi
      .getCard(id)
      .then((data: CareCard) => {
        setCard(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Link
          to="/care-cards"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          返回养护卡列表
        </Link>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500">养护卡不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/care-cards"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        返回养护卡列表
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {card.plantSpecies}
        </h1>
      </div>

      <div className="space-y-6">
        {sectionConfig.map(
          (section) =>
            card[section.field] && (
              <div
                key={section.label}
                className="border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <section.icon className={`w-4 h-4 ${section.iconColor}`} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.label}
                  </h2>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {card[section.field]}
                </p>
              </div>
            ),
        )}
      </div>
    </div>
  );
};

export default CareCardDetailPage;