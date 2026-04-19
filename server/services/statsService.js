const statsRepo = require('../repositories/statsRepository');

const overview = async (userId) => {
  const [stageRows, offerRate, weeklyTrend, jobTypeRows] = await Promise.all([
    statsRepo.stageCounts(userId),
    statsRepo.offerRate(userId),
    statsRepo.weeklyTrend(userId),
    statsRepo.byJobType(userId),
  ]);

  const stageCounts = Object.fromEntries(stageRows.map((r) => [r.stage, r.count]));
  const totalApplied = offerRate.total_applied || 0;
  const totalOffers = offerRate.total_offers || 0;
  const offerRatePct = totalApplied > 0
    ? Math.round((totalOffers / totalApplied) * 10000) / 100
    : 0;

  const byJobType = Object.fromEntries(jobTypeRows.map((r) => [r.job_type, r.count]));

  return {
    stageCounts,
    offerRate: offerRatePct,
    weeklyTrend: weeklyTrend.map((r) => ({ week: r.week, count: r.count })),
    byJobType,
  };
};

module.exports = { overview };
