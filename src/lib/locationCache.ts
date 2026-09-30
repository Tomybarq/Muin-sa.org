import prisma from "@/lib/prisma";

let cachedGovs: { id: number; name: string; nameAr: string }[] | null = null;
let govsTimestamp = 0;

let cachedCities: { id: number; name: string; nameAr: string; governorateId: number }[] | null = null;
let citiesTimestamp = 0;

const LOCATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getCachedGovernorates() {
  const now = Date.now();
  if (cachedGovs && now - govsTimestamp < LOCATION_CACHE_TTL) {
    return cachedGovs;
  }
  try {
    const govs = await prisma.governorate.findMany({ orderBy: { nameAr: "asc" } });
    cachedGovs = govs;
    govsTimestamp = Date.now();
    return govs;
  } catch (err) {
    console.error("[LOCATION_CACHE] getCachedGovernorates error:", err);
    return cachedGovs || [];
  }
}

export async function getCachedCities() {
  const now = Date.now();
  if (cachedCities && now - citiesTimestamp < LOCATION_CACHE_TTL) {
    return cachedCities;
  }
  try {
    const cities = await prisma.city.findMany({ orderBy: { nameAr: "asc" } });
    cachedCities = cities;
    citiesTimestamp = Date.now();
    return cities;
  } catch (err) {
    console.error("[LOCATION_CACHE] getCachedCities error:", err);
    return cachedCities || [];
  }
}
