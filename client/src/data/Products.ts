const API_URL = "/api/v1";

export interface Watch {
  id: string;
  name: string;
  referenceNumber: string;
  slug: string;
  thumbnailUrl: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  series: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface WatchesResponse {
  data: Watch[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function getRolexWatches(): Promise<WatchesResponse> {
  const response = await fetch(
    `${API_URL}/models?brand=rolex&page=1&pageSize=24`
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result: WatchesResponse = await response.json();

  console.log("Rolex Watches:", result);

  return result;
}