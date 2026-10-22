import { queryOptions } from "@tanstack/react-query";
import { getPublicMaster } from "@/lib/master.functions";

export const masterQuery = (id: string) =>
  queryOptions({
    queryKey: ["master", id],
    queryFn: () => getPublicMaster({ data: { id } }),
  });
