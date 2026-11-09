import { getDynamicData } from "@/utils/dynamic-data";

export async function GET(): Promise<Response> {
	return Response.json(await getDynamicData());
}
