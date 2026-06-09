/** Seed reference data: common usvisa-info embassy codes + facility ids.
 * Inlined from @visa-lark/adapter-usvisa-info so apps/web is self-contained
 * and deploys as a standalone Next.js project (no pnpm workspace resolution
 * needed on the host). Keep in sync with the adapter package if it changes.
 * Facility ids are stable per consulate; embassy code is the locale path segment.
 */
export interface FacilitySeed {
  id: string;
  name: string;
  city: string;
  country: string;
  embassyCode: string;
}

export const FACILITY_SEEDS: FacilitySeed[] = [
  // China (en-cn)
  { id: "95", name: "Beijing", city: "北京", country: "China", embassyCode: "en-cn" },
  { id: "96", name: "Chengdu", city: "成都", country: "China", embassyCode: "en-cn" },
  { id: "97", name: "Guangzhou", city: "广州", country: "China", embassyCode: "en-cn" },
  { id: "98", name: "Shanghai", city: "上海", country: "China", embassyCode: "en-cn" },
  { id: "99", name: "Shenyang", city: "沈阳", country: "China", embassyCode: "en-cn" },
  { id: "100", name: "Wuhan", city: "武汉", country: "China", embassyCode: "en-cn" },
  // Hong Kong (en-hk)
  { id: "94", name: "Hong Kong", city: "香港", country: "Hong Kong", embassyCode: "en-hk" },
  // Japan (en-jp)
  { id: "120", name: "Tokyo", city: "東京", country: "Japan", embassyCode: "en-jp" },
  { id: "121", name: "Osaka", city: "大阪", country: "Japan", embassyCode: "en-jp" },
  // Korea (en-kr)
  { id: "122", name: "Seoul", city: "서울", country: "Korea", embassyCode: "en-kr" },
  // Singapore (en-sg)
  { id: "123", name: "Singapore", city: "Singapore", country: "Singapore", embassyCode: "en-sg" },
];
