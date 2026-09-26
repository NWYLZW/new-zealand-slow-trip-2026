import { PencilText } from "./pencil/PencilText";

export function MapSources() {
  return <details className="trip-map-sources">
    <summary><PencilText>地图数据来源</PencilText></summary>
    <ul>
      <li><a href="https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-linz-data" target="_blank" rel="noreferrer"><PencilText>LINZ water data · CC BY 4.0</PencilText></a>
        <p><PencilText>Contains data sourced from the LINZ Data Service licensed for reuse under CC BY 4.0.</PencilText></p></li>
      <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer"><PencilText>Natural Earth · 公共领域</PencilText></a>
        <p><PencilText>海岸线、河湖与海洋深度。</PencilText></p></li>
      <li><a href="https://esa-worldcover.org/en/data-access" target="_blank" rel="noreferrer"><PencilText>ESA WorldCover 2021 · CC BY 4.0</PencilText></a>
        <p><PencilText>Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium. 地表分类经概化处理。</PencilText></p></li>
      <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"><PencilText>© OpenStreetMap contributors · ODbL 1.0</PencilText></a>
        <p><PencilText>公路路径由</PencilText>{" "}<a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer"><PencilText>OSRM / FOSSGIS</PencilText></a>{" "}<PencilText>计算并保存在本地，不含实时路况。</PencilText>
          {" "}<a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer"><PencilText>纠正地图</PencilText></a></p></li>
    </ul>
  </details>;
}
