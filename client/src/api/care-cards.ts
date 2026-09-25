import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { CareCard, PaginatedResponse } from '@shared/api.interface';

export const listCards = async (
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<CareCard>> => {
  const res = await axiosForBackend.get<PaginatedResponse<CareCard>>(
    '/api/care-cards',
    { params: { page, pageSize } },
  );
  return res.data;
};

export const getCard = async (id: string): Promise<CareCard> => {
  const res = await axiosForBackend.get<CareCard>(`/api/care-cards/${id}`);
  return res.data;
};