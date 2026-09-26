import { PencilText } from "./pencil/PencilText";
import { useLanguage } from "../LanguageContext";

export function MapSources() {
  const { language } = useLanguage();
  return <section className="trip-map-sources trip-map-sources-page" aria-label={language === "en" ? "Map data sources" : "地图数据来源"}>
    <ul>
      <li><a href="https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-linz-data" target="_blank" rel="noreferrer"><PencilText>LINZ water data · CC BY 4.0</PencilText></a>
        <p><PencilText>Contains data sourced from the LINZ Data Service licensed for reuse under CC BY 4.0.</PencilText></p></li>
      <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer"><PencilText>Natural Earth · 公共领域</PencilText></a>
        <p><PencilText>{language === "en"
          ? "New Zealand coastlines, lakes and ocean depth, plus world land and airport points for the international overview. Airport points are illustrative and not for aeronautical navigation."
          : "新西兰海岸线、河湖与海洋深度，以及国际总览中的世界陆地和机场点位。机场点位仅作行程示意，不用于航空导航。"}</PencilText></p></li>
      <li><a href="https://esa-worldcover.org/en/data-access" target="_blank" rel="noreferrer"><PencilText>ESA WorldCover 2021 · CC BY 4.0</PencilText></a>
        <p><PencilText>Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium. 地表分类经概化处理。</PencilText></p></li>
      <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"><PencilText>© OpenStreetMap contributors · ODbL 1.0</PencilText></a>
        <p><PencilText>城镇局部图使用本地保存并概化的道路、建筑、水体与街区矢量快照；城际公路路径由</PencilText>{" "}<a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer"><PencilText>OSRM / FOSSGIS</PencilText></a>{" "}<PencilText>计算并保存在本地。两者均不含实时路况，也不作为导航。</PencilText>
          {" "}<a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer"><PencilText>纠正地图</PencilText></a></p></li>
    </ul>
  </section>;
}
