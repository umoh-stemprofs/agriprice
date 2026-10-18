# Real price sources for Nigeria / West Africa — research findings

Research only (step 2.3). **Nothing from this file is wired into the app.**
The app still runs entirely on the deterministic simulated feed with a
"Simulated" badge.

Question asked: a free source of real crop prices for Nigeria or West Africa,
daily or weekly, no paid API key, whose terms clearly allow reuse in an app,
covering maize, rice, cassava or yams.

**Short answer: no source was found that clearly meets all of it at once.**
Several are free and well licensed, but their *observed* prices are mostly
monthly, not daily or weekly. Below: each candidate, then the verdict.

Update frequency distinguishes the advertised refresh schedule from how often
prices are actually observed — they differ on several sites.

## Candidates checked

### 1. FAO GIEWS FPMA Tool — food price data
- **Link:** https://fpma.fao.org/giews/fpmat4/#/dashboard/tool/domestic · overview https://www.fao.org/prices/en
- **Updates:** varies by country and reporting source; no Nigeria-specific daily/weekly commitment found.
- **Key / registration:** none found for viewing.
- **Terms:** CC BY 4.0 plus FAO database terms (https://www.fao.org/contact-us/terms/db-terms-of-use/en/) — attribution required, and datasets must not be used to promote a commercial enterprise or imply FAO endorsement. Non-commercial app use looks possible; commercial use is restricted or unclear.
- **Crops / coverage:** domestic consumer and wholesale prices, market level where available; Nigeria is covered. Maize and rice plausible; cassava and yam **not verified** for Nigeria.
- *Caveat: the tool is interactive; no machine-readable endpoint was confirmed.*

### 2. FAOSTAT Agricultural Producer Prices
- **Link:** https://www.fao.org/faostat/en/#data/PP
- **Updates:** annual (some countries have monthly series).
- **Key:** none.
- **Terms:** CC BY 4.0 plus the same FAO database terms — attribution, no commercial-enterprise promotion; commercial use not clearly permitted.
- **Crops / coverage:** national farm-gate producer prices (not market quotes). Nigeria and other West African countries; maize, rice, cassava and yams exist in FAOSTAT as products.
- *Caveat: annual granularity is too coarse for a "sell now or hold" feed.*

### 3. WFP food prices — Nigeria dataset on HDX
- **Link:** https://data.humdata.org/dataset/wfp-food-prices-for-nigeria · portal https://dataviz.vam.wfp.org/economic/prices
- **Updates:** the WFP database is described as updated weekly, but the Nigeria dataset is listed as **monthly** and is mostly monthly observations.
- **Key:** none — public CSV files.
- **Terms:** **CC BY-IGO** (Creative Commons Attribution for Intergovernmental Organisations). Reuse in an app is permitted with attribution.
- **Crops / coverage:** Nigeria, market/sub-national level. **Maize and rice confirmed**; cassava and yam not confirmed on the listing.
- *Note: the older global WFP HDX dataset is marked no longer updated — do not use it.*

### 4. FEWS NET staple-food prices — Nigeria
- **Link:** https://fews.net/data/markets-and-trade · https://data.humdata.org/dataset/fewsnet_staple_food_price_data_for_nigeria_weekly_6837
- **Updates:** general series are monthly; the Nigeria HDX record is titled "Weekly" but its expected update frequency is listed as **Never** (last touched 2025).
- **Key:** none — public CSV/XLSX.
- **Terms:** **CC BY** on the HDX record — app reuse permitted with attribution.
- **Crops / coverage:** Nigeria, selected markets; crop list not established from the pages read (check dataset metadata). West Africa coverage varies by country download.
- *Caveat: clear licence, but the feed does not appear to be maintained as listed.*

### 5. World Bank — Real Time Food Prices, Nigeria (modelled estimates)
- **Link:** https://microdata.worldbank.org/index.php/catalog/4503/study-description
- **Updates:** dataset compiled and updated **weekly**; the price estimates themselves are **monthly** and may be revised.
- **Key:** none — open data (check the record still shows open access).
- **Terms:** published as open data; World Bank default dataset licence **CC BY 4.0** (https://datacatalog.worldbank.org/public-licenses) — commercial reuse with attribution unless the record says otherwise. **Clearest terms of the group.**
- **Crops / coverage:** Nigeria, **73 markets**, market level; products listed include **maize, rice, yam and gari** (a cassava product; raw cassava not listed). Also covers other West African countries.
- *Caveat: these are modelled estimates, not fresh quotes — label them as estimates if ever used.*

### 6. World Bank Commodity Markets "Pink Sheet"
- **Link:** https://www.worldbank.org/en/research/commodity-markets · dataset https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections
- **Updates:** monthly, second business day of the month.
- **Key:** none.
- **Terms:** **CC BY 4.0** — commercial reuse with attribution.
- **Crops / coverage:** international benchmark prices (maize, rice; no cassava/yam). **Not** Nigerian market prices — a world reference only.

### 7. IMF Primary Commodity Prices
- **Link:** https://www.imf.org/en/research/commodity-prices
- **Updates:** monthly.
- **Key:** none, but terms prohibit automated bulk downloading without permission; commercial reuse requires emailing copyright@imf.org.
- **Crops / coverage:** international commodity prices/indices, not domestic Nigerian market quotes. **Terms not clear for an app — not recommended.**

### 8. Nigeria NBS — Selected Food Price Watch
- **Link:** https://microdata.nigerianstat.gov.ng/index.php/catalog/162 · reports https://nigerianstat.gov.ng
- **Updates:** **monthly**, collected across all 774 LGAs, reported by state and nationally.
- **Key:** none.
- **Terms:** no open-data licence found. NBS terms (https://nigerianstat.gov.ng/page/terms) say data will not be redistributed or sold without written agreement. **Unclear for app reuse — do not use.**
- **Crops / coverage:** rice and yam confirmed, white garri (processed cassava) confirmed; maize not established for this series. Nigeria only.

### 9. data.gov.ng (Nigeria open data portal)
- **Link:** https://data.gov.ng/
- **Updates / key / terms:** no relevant crop-price dataset with a verified licence was found (the portal did not load reliably during this check).
- **Verdict:** not usable until a specific dataset and its licence are identified.

### 10. Ministry sources (E-WIN / FMARD), NAERLS weekly reports, RESIMAO
- **Links:** https://agriculture.gov.ng/ · https://naerls.gov.ng/tag/weekly-commodity-prices/ · https://www.resimao.org/
- **Findings:** all three look promising on the surface (NAERLS publishes weekly commodity price reports; RESIMAO is a West African market-information network), but none produced a verified current data file, schedule or licence during this check — the ministry site timed out, the NAERLS page returned unrelated content, RESIMAO returned nothing readable.
- **Verdict:** unverified leads, not sources. Public availability does not imply the right to redistribute.

## Verdict

Sources with **clear terms** good enough to consider later, in order:

1. **World Bank Real Time Food Prices (Nigeria)** — CC BY 4.0, 73 Nigerian markets, lists maize, rice, yam and gari. Best fit; must be labelled as monthly *estimates*.
2. **WFP Nigeria food prices on HDX** — CC BY-IGO, confirms maize and rice, market level; monthly observations.
3. **FEWS NET Nigeria** — CC BY (clear), but listed as no longer updating; use only after confirming the files are maintained.

Not usable without permission or clarification: **NBS**, **IMF**, and FAO data
for anything commercial. Pink Sheet is clear-licensed but is an international
benchmark, not a local price feed.

**Nothing was wired.** No source with unclear terms will be used. Before any
integration: re-check the dataset-specific licence, confirm the actual dates of
the newest records, and decide how the badge should read (these would all be
"Saved data", never simulated).

*This is a source and terms assessment, not legal advice.*

## Pages read

- FAO: https://www.fao.org/prices/en · https://www.fao.org/giews/food-prices/data-partners/en/ · https://fpma.fao.org/giews/fpmat4/#/dashboard/tool/domestic · https://www.fao.org/contact-us/terms/db-terms-of-use/en/ · https://www.fao.org/statistics/events/events-detail/producer-prices.-january-2025-update/en
- WFP/HDX: https://data.humdata.org/dataset/wfp-food-prices-for-nigeria · https://data.humdata.org/dataset/wfp-food-prices · https://dataviz.vam.wfp.org/economic/prices
- FEWS NET: https://fews.net/data/markets-and-trade · https://data.humdata.org/dataset/fewsnet_staple_food_price_data_for_nigeria_weekly_6837
- World Bank: https://microdata.worldbank.org/index.php/catalog/4503/study-description · https://microdata.worldbank.org/index.php/terms-of-use · https://datacatalog.worldbank.org/public-licenses · https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections · https://data.worldbank.org/summary-terms-of-use
- IMF: https://www.imf.org/en/research/commodity-prices · https://www.imf.org/en/about/copyright-and-terms
- Nigeria: https://microdata.nigerianstat.gov.ng/index.php/catalog/162 · https://nigerianstat.gov.ng/page/terms · https://data.gov.ng/ · https://agriculture.gov.ng/ · https://naerls.gov.ng/tag/weekly-commodity-prices/
- Other: https://www.resimao.org/
