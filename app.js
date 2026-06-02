const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const regions = ["West", "Central", "East"];
const channels = ["Organic", "Paid Search", "Social"];
const segments = ["New", "Returning"];

const baseRevenue = [122, 128, 135, 142, 151, 158, 166, 172, 178, 181, 177, 174];
const repeatRate = [31.2, 31.8, 32.5, 33.1, 34.0, 34.4, 35.2, 35.8, 36.3, 35.1, 33.7, 32.8];
const deliveryDays = [3.1, 3.0, 3.0, 2.9, 2.9, 3.0, 3.1, 3.1, 3.2, 3.8, 4.4, 4.7];
const ticketRate = [6.2, 6.0, 5.9, 5.8, 5.7, 5.9, 6.0, 6.1, 6.4, 7.8, 9.3, 10.1];

const regionFactors = { West: 1.08, Central: 0.91, East: 1.01 };
const channelFactors = { Organic: 1.1, "Paid Search": 1.04, Social: 0.86 };
const segmentFactors = { New: 0.48, Returning: 0.52 };

const rows = [];

months.forEach((month, monthIndex) => {
  regions.forEach((region, regionIndex) => {
    channels.forEach((channel, channelIndex) => {
      segments.forEach((segment) => {
        const mix = regionFactors[region] * channelFactors[channel] * segmentFactors[segment];
        const seasonalAdjustment = 1 + ((regionIndex - channelIndex) * 0.012);
        const revenue = baseRevenue[monthIndex] * 1000 * mix * seasonalAdjustment;
        const aov = segment === "Returning" ? 87 : 72;
        const rateAdjustment =
          (segment === "Returning" ? 7.2 : -6.8) +
          (channel === "Organic" ? 1.8 : channel === "Social" ? -1.6 : 0) +
          (region === "West" ? 0.7 : region === "Central" ? -0.6 : 0);
        const deliveryAdjustment =
          (region === "Central" ? 0.35 : region === "West" ? -0.12 : 0.05) +
          (channel === "Social" ? 0.08 : 0);

        rows.push({
          month,
          monthIndex,
          region,
          channel,
          segment,
          revenue,
          orders: Math.round(revenue / aov),
          repeatRate: Math.max(3, repeatRate[monthIndex] + rateAdjustment),
          deliveryDays: deliveryDays[monthIndex] + deliveryAdjustment,
          ticketRate: ticketRate[monthIndex] + deliveryAdjustment * 0.7,
        });
      });
    });
  });
});

const selectors = {
  region: document.querySelector("#region"),
  channel: document.querySelector("#channel"),
  segment: document.querySelector("#segment"),
};

function filteredRows() {
  return rows.filter((row) =>
    Object.entries(selectors).every(([key, select]) => select.value === "All" || row[key] === select.value)
  );
}

function aggregateByMonth(data) {
  return months.map((month, monthIndex) => {
    const monthly = data.filter((row) => row.month === month);
    const totalRevenue = monthly.reduce((sum, row) => sum + row.revenue, 0);
    const totalOrders = monthly.reduce((sum, row) => sum + row.orders, 0);
    const weightedAverage = (field) =>
      monthly.reduce((sum, row) => sum + row[field] * row.orders, 0) / totalOrders;

    return {
      month,
      monthIndex,
      revenue: totalRevenue,
      orders: totalOrders,
      repeatRate: weightedAverage("repeatRate"),
      deliveryDays: weightedAverage("deliveryDays"),
      ticketRate: weightedAverage("ticketRate"),
    };
  });
}

function sum(data, field) {
  return data.reduce((total, row) => total + row[field], 0);
}

function weightedAverage(data, field) {
  const orders = sum(data, "orders");
  return data.reduce((total, row) => total + row[field] * row.orders, 0) / orders;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value > 999999 ? "compact" : "standard",
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function changeLabel(current, previous, inverse = false) {
  const difference = ((current - previous) / previous) * 100;
  const favorable = inverse ? difference <= 0 : difference >= 0;
  return {
    text: `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}% vs. H1 average`,
    className: favorable ? "positive" : "negative",
  };
}

function renderKpis(monthly) {
  const latest = monthly.slice(6);
  const baseline = monthly.slice(0, 6);
  const current = {
    revenue: sum(latest, "revenue"),
    orders: sum(latest, "orders"),
    repeatRate: weightedAverage(latest, "repeatRate"),
    deliveryDays: weightedAverage(latest, "deliveryDays"),
  };
  const previous = {
    revenue: sum(baseline, "revenue"),
    orders: sum(baseline, "orders"),
    repeatRate: weightedAverage(baseline, "repeatRate"),
    deliveryDays: weightedAverage(baseline, "deliveryDays"),
  };

  const config = [
    ["revenue", formatMoney(current.revenue), false],
    ["orders", formatNumber(current.orders), false],
    ["repeat", `${current.repeatRate.toFixed(1)}%`, false, "repeatRate"],
    ["delivery", `${current.deliveryDays.toFixed(1)} days`, true, "deliveryDays"],
  ];

  config.forEach(([id, value, inverse, metric = id]) => {
    document.querySelector(`#${id}-value`).textContent = value;
    const label = changeLabel(current[metric], previous[metric], inverse);
    const change = document.querySelector(`#${id}-change`);
    change.textContent = label.text;
    change.className = label.className;
  });

  const annualRevenue = monthly.reduce((total, row) => total + row.revenue, 0);
  document.querySelector("#opportunity-value").textContent = formatMoney(annualRevenue * 0.03);
}

function renderTrendChart(monthly) {
  const svg = document.querySelector("#trend-chart");
  const width = 860;
  const height = 322;
  const padding = { top: 18, right: 30, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxRevenue = Math.max(...monthly.map((row) => row.revenue)) * 1.12;
  const minRepeat = Math.min(...monthly.map((row) => row.repeatRate)) - 3;
  const maxRepeat = Math.max(...monthly.map((row) => row.repeatRate)) + 3;
  const step = chartWidth / monthly.length;
  const barWidth = Math.min(38, step * 0.56);
  const x = (index) => padding.left + step * index + step / 2;
  const revenueY = (value) => padding.top + chartHeight - (value / maxRevenue) * chartHeight;
  const repeatY = (value) =>
    padding.top + chartHeight - ((value - minRepeat) / (maxRepeat - minRepeat)) * chartHeight;
  const repeatPoints = monthly.map((row, index) => `${x(index)},${repeatY(row.repeatRate)}`).join(" ");

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((tick) => {
      const y = padding.top + chartHeight * (1 - tick);
      return `
        <line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />
        <text class="chart-label" x="4" y="${y + 4}">${formatMoney(maxRevenue * tick)}</text>
      `;
    })
    .join("");

  const bars = monthly
    .map((row, index) => {
      const y = revenueY(row.revenue);
      return `
        <rect class="revenue-bar" x="${x(index) - barWidth / 2}" y="${y}" width="${barWidth}" height="${padding.top + chartHeight - y}" rx="4" />
        <text class="chart-label" text-anchor="middle" x="${x(index)}" y="${height - 16}">${row.month}</text>
      `;
    })
    .join("");

  const dots = monthly
    .map((row, index) => `<circle class="repeat-dot" cx="${x(index)}" cy="${repeatY(row.repeatRate)}" r="5" />`)
    .join("");

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `${grid}${bars}<polyline class="repeat-line" points="${repeatPoints}" />${dots}`;
}

function renderTicketChart(monthly) {
  const latestRate = weightedAverage(monthly.slice(9), "ticketRate");
  const drivers = [
    ["Late delivery", latestRate * 4.8],
    ["Order tracking", latestRate * 2.7],
    ["Returns", latestRate * 2.1],
    ["Payment", latestRate * 1.35],
  ];
  const max = Math.max(...drivers.map(([, value]) => value));

  document.querySelector("#ticket-chart").innerHTML = drivers
    .map(
      ([label, value]) => `
      <div class="horizontal-row">
        <span>${label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
        <strong>${Math.round(value)}%</strong>
      </div>
    `
    )
    .join("");
}

function updateDashboard() {
  const monthly = aggregateByMonth(filteredRows());
  renderKpis(monthly);
  renderTrendChart(monthly);
  renderTicketChart(monthly);
}

Object.values(selectors).forEach((select) => select.addEventListener("change", updateDashboard));
document.querySelector("#reset-filters").addEventListener("click", () => {
  Object.values(selectors).forEach((select) => {
    select.value = "All";
  });
  updateDashboard();
});

updateDashboard();
