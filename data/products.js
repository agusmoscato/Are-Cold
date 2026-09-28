/* Catálogo de Refrigeración Are-Cold.
   Fuente única de datos: reemplazar/ampliar acá escala directo a los ~200
   productos reales o a una conexión con un panel de administración.
   Se carga como script (no fetch) para que la demo funcione abriendo
   el archivo directo, sin servidor. products.json documenta el mismo
   esquema para una futura integración con API. */
const AECOLD_DATA = {
  "categories": [
    { "slug": "heladeras", "name": "Heladeras", "icon": "fridge" },
    { "slug": "freezer", "name": "Freezer", "icon": "freezer" },
    { "slug": "lavarropas", "name": "Lavarropas", "icon": "washer" },
    { "slug": "secadoras", "name": "Secadoras", "icon": "dryer" },
    { "slug": "lavavajillas", "name": "Lavavajillas", "icon": "dishwasher" },
    { "slug": "coccion", "name": "Cocción", "icon": "stove" },
    { "slug": "campanas", "name": "Campanas", "icon": "hood" },
    { "slug": "aires-acondicionados", "name": "Aires acondicionados", "icon": "ac" },
    { "slug": "calefaccion", "name": "Calefacción", "icon": "heater" },
    { "slug": "termotanques", "name": "Termotanques", "icon": "waterheater" },
    { "slug": "smart-tv", "name": "Smart TV", "icon": "tv" },
    { "slug": "colchones", "name": "Colchones", "icon": "mattress" },
    { "slug": "pequenos-electrodomesticos", "name": "Pequeños electrodomésticos", "icon": "blender" },
    { "slug": "repuestos", "name": "Repuestos", "icon": "gear" }
  ],
  "products": [
    {
      "id": "p01",
      "name": "Heladera con freezer superior",
      "category": "heladeras",
      "tag": "destacado",
      "description": "Heladera con freezer de dos puertas, pensada para el consumo diario de una familia. Fría de manera pareja y no ocupa un espacio excesivo en la cocina.",
      "features": [
        "Capacidad aproximada: 320 litros",
        "Freezer superior independiente",
        "Estantes de vidrio templado",
        "Bajo consumo eléctrico",
        "Terminación blanca"
      ]
    },
    {
      "id": "p02",
      "name": "Heladera cíclica una puerta",
      "category": "heladeras",
      "tag": "",
      "description": "Heladera compacta de una puerta, ideal para departamentos, oficinas o como segunda heladera.",
      "features": [
        "Capacidad aproximada: 190 litros",
        "Deshielo cíclico automático",
        "Balconera reforzada",
        "Terminación blanca o inox"
      ]
    },
    {
      "id": "p03",
      "name": "Freezer horizontal",
      "category": "freezer",
      "tag": "oferta",
      "description": "Freezer horizontal de buena capacidad, pensado para guardar mercadería en cantidad sin ocupar mucho lugar en altura.",
      "features": [
        "Capacidad aproximada: 300 litros",
        "Tapa con cierre hermético",
        "Cesto organizador incluido",
        "Sistema de control de temperatura"
      ]
    },
    {
      "id": "p04",
      "name": "Freezer vertical",
      "category": "freezer",
      "tag": "",
      "description": "Freezer vertical con cajones, para ordenar la mercadería por tipo y encontrar todo rápido.",
      "features": [
        "Capacidad aproximada: 220 litros",
        "Cajones deslizables",
        "Puerta reversible",
        "Terminación blanca"
      ]
    },
    {
      "id": "p05",
      "name": "Lavarropas carga frontal",
      "category": "lavarropas",
      "tag": "destacado",
      "description": "Lavarropas automático de carga frontal, con varios programas de lavado para distintos tipos de tela.",
      "features": [
        "Capacidad aproximada: 8 kg",
        "Múltiples programas de lavado",
        "Centrifugado de alta velocidad",
        "Visor de puerta",
        "Bajo nivel de ruido"
      ]
    },
    {
      "id": "p06",
      "name": "Lavarropas carga superior",
      "category": "lavarropas",
      "tag": "",
      "description": "Lavarropas de carga superior, práctico para el uso diario y de fácil manejo.",
      "features": [
        "Capacidad aproximada: 7 kg",
        "Programas rápidos",
        "Tina de acero inoxidable",
        "Control mecánico"
      ]
    },
    {
      "id": "p07",
      "name": "Secarropas a condensación",
      "category": "secadoras",
      "tag": "",
      "description": "Secarropas que no necesita salida al exterior, ideal para completar el lavado en días de lluvia o poco sol.",
      "features": [
        "Capacidad aproximada: 6 kg",
        "Sistema por condensación",
        "Programas por tipo de tela",
        "Filtro de pelusa extraíble"
      ]
    },
    {
      "id": "p08",
      "name": "Lavavajillas empotrable",
      "category": "lavavajillas",
      "tag": "",
      "description": "Lavavajillas para instalar bajo mesada, con varios programas según el nivel de suciedad de la vajilla.",
      "features": [
        "Capacidad para 12 cubiertos",
        "Programas eco y intensivo",
        "Cestos ajustables",
        "Bajo consumo de agua"
      ]
    },
    {
      "id": "p09",
      "name": "Cocina a gas de 4 hornallas",
      "category": "coccion",
      "tag": "",
      "description": "Cocina a gas con horno y grill, pensada para el uso diario de una cocina familiar.",
      "features": [
        "4 hornallas con encendido eléctrico",
        "Horno con grill",
        "Tapa de vidrio templado",
        "Patas niveladoras"
      ]
    },
    {
      "id": "p10",
      "name": "Anafe eléctrico dos hornallas",
      "category": "coccion",
      "tag": "",
      "description": "Anafe eléctrico compacto, práctico como cocina principal en espacios chicos o de apoyo en la cocina principal.",
      "features": [
        "2 hornallas eléctricas",
        "Perillas de control de temperatura",
        "Superficie de fácil limpieza",
        "Terminación en acero"
      ]
    },
    {
      "id": "p11",
      "name": "Campana de cocina",
      "category": "campanas",
      "tag": "",
      "description": "Campana extractora para instalar sobre la cocina, ayuda a mantener el aire y las paredes libres de grasa y humo.",
      "features": [
        "Extracción o recirculación",
        "Filtro de aluminio lavable",
        "Iluminación incorporada",
        "Varias velocidades de extracción"
      ]
    },
    {
      "id": "p12",
      "name": "Aire acondicionado split frío/calor",
      "category": "aires-acondicionados",
      "tag": "oferta",
      "description": "Equipo split frío/calor para climatizar un ambiente durante todo el año, con control remoto incluido.",
      "features": [
        "3000 frigorías aproximadas",
        "Frío y calor",
        "Control remoto incluido",
        "Filtro purificador de aire",
        "Bajo nivel de ruido"
      ]
    },
    {
      "id": "p13",
      "name": "Calefactor tiro balanceado",
      "category": "calefaccion",
      "tag": "",
      "description": "Calefactor a gas de tiro balanceado, toma el aire de afuera y expulsa los gases al exterior sin consumir el oxígeno del ambiente.",
      "features": [
        "Instalación con salida a pared",
        "Encendido piezoeléctrico",
        "Termostato regulable",
        "Apto para ambientes medianos"
      ]
    },
    {
      "id": "p14",
      "name": "Termotanque a gas",
      "category": "termotanques",
      "tag": "",
      "description": "Termotanque a gas para agua caliente en toda la casa, con pantalla piloto y buena recuperación.",
      "features": [
        "Capacidad aproximada: 80 litros",
        "Encendido piezoeléctrico",
        "Válvula de seguridad",
        "Apto gas natural o envasado"
      ]
    },
    {
      "id": "p15",
      "name": "Smart TV 50 pulgadas",
      "category": "smart-tv",
      "tag": "destacado",
      "description": "Smart TV con aplicaciones integradas para mirar tus plataformas favoritas sin necesidad de otro dispositivo.",
      "features": [
        "Pantalla de 50 pulgadas",
        "Resolución 4K",
        "Wi-Fi integrado",
        "Control remoto con acceso directo a apps",
        "Varias entradas HDMI y USB"
      ]
    },
    {
      "id": "p16",
      "name": "Colchón de resortes pocket",
      "category": "colchones",
      "tag": "",
      "description": "Colchón de resortes independientes, se adapta al cuerpo y reduce el movimiento entre las dos plazas.",
      "features": [
        "Medida: 2 plazas (140x190 cm)",
        "Resortes pocket independientes",
        "Tela acolchada antialérgica",
        "Doble faz verano/invierno"
      ]
    },
    {
      "id": "p17",
      "name": "Microondas con grill",
      "category": "pequenos-electrodomesticos",
      "tag": "",
      "description": "Microondas con función grill, práctico para calentar, descongelar y dorar en pocos minutos.",
      "features": [
        "Capacidad aproximada: 25 litros",
        "Función grill",
        "Programas automáticos",
        "Plato giratorio de vidrio"
      ]
    },
    {
      "id": "p18",
      "name": "Burlete para heladera",
      "category": "repuestos",
      "tag": "",
      "description": "Burlete de repuesto para puerta de heladera, ayuda a mantener el frío y bajar el consumo eléctrico. Consultanos el modelo de tu equipo.",
      "features": [
        "Varias medidas disponibles",
        "Consultar según marca y modelo",
        "Instalación sencilla",
        "Mejora el sellado de la puerta"
      ]
    },
    {
      "id": "p19",
      "name": "Motor de lavarropas",
      "category": "repuestos",
      "tag": "",
      "description": "Motor de repuesto para lavarropas automático. Traé el dato de tu equipo o el motor usado y te asesoramos sobre el reemplazo.",
      "features": [
        "Consultar compatibilidad por marca y modelo",
        "Repuesto para carga frontal y superior",
        "Asesoramiento para el recambio",
        "Instalación no incluida"
      ]
    }
  ]
};
