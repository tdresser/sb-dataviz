import './style.css'

import * as d3 from 'd3';
import csv from './assets/data.csv.gzip';
import "gridjs/dist/theme/mermaid.css";
import { fail } from './util';
import { SchoolRow, State } from './state';
import { MainView } from './views/historyView';
import { BoardRankingView } from './views/boardRankingView';
import { ViewManager, Views } from './views/viewManager';

let state: State | null = null;

async function main() {
  const body = (await fetch(csv)).body || fail();
  const ds = new DecompressionStream("gzip");
  const reader = body.pipeThrough(ds).getReader();
  let decompressedString = "";
  while (true) {
    const { done, value } = await reader.read();
    decompressedString += new TextDecoder().decode(value);
    if (done) {
      break;
    }
  }
  const df = d3.csvParse(decompressedString);
  const schoolRows : SchoolRow[] = []
  for (const d of df) {
    // Year,Board,School,Address,City,Area,energyNorm (ekWh/HDD),ghgNorm (kg/HDD)

    schoolRows.push(new SchoolRow({
      year: parseInt(d['Year']),
      board: d['Board'],
      school: d["School"],
      address: d["Address"],
      city: d["City"],
      area: parseFloat(d["Area"]),
      energyNorm: parseFloat(d["energyNorm (ekWh/HDD)"]),
      ghgNorm: parseFloat(d["ghgNorm (kg/HDD)"]),
    }));
  }

  state = new State(schoolRows);

  const views:Views = []
  const viewManager = new ViewManager(views)
  views.push(new MainView(state, viewManager));
  views.push(new BoardRankingView());

  await state.init();
  viewManager.updateFromState(state);
}

main();