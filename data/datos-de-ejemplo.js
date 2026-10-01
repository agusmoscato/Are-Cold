/* ============================================================
   DATOS DE EJEMPLO — NO SON DATOS REALES DEL NEGOCIO
   ============================================================
   Es el catálogo de muestra usado durante el desarrollo (14 categorías con
   sus subcategorías, 27 productos de ejemplo, textos y datos del negocio).

   Se usa en tres casos:
   1. Fallback del sitio público cuando NO hay base de datos conectada
      (api/data.php lo sirve si falla la conexión, y las páginas lo cargan
      solas si se abren sin servidor). El sitio muestra un aviso arriba.
   2. api/install.php: datos iniciales al instalar.
   3. sql/generar.php: arma sql/arecold-base-inicial.sql.

   El panel de administración NUNCA usa este archivo.
   Formato: tiene que quedar como "window.AECOLD_DEMO = { ...JSON válido... };"
   porque PHP lo lee como JSON (ver load_demo_data() en api/lib/repo.php). */
window.AECOLD_DEMO = {
  "settings": {
    "whatsapp": "5492326422390",
    "whatsappDisplay": "2326-422390",
    "address": "Italia 727",
    "city": "San Antonio de Areco",
    "hours": "Lunes a viernes de 8 a 12 hs y de 15 a 18 hs.\nSábados y domingos, cerrado.",
    "hoursShort": "Lunes a viernes, 8 a 12 y 15 a 18 hs",
    "instagram": "https://www.instagram.com/refigeracion.arecold",
    "facebook": "https://www.facebook.com/RefrigeracionArecold",
    "mapEmbed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1648.830354113327!2d-59.47645789714209!3d-34.25720034921181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bbeab398c81597%3A0xa8647181784462e0!2sItalia%20727%2C%20B2760%20San%20Antonio%20de%20Areco%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1790821329283!5m2!1ses!2sar",
    "heroEyebrow": "Electrodomésticos, climatización y repuestos",
    "heroTitle": "El clima de tu casa, resuelto",
    "heroHighlight": "todo el año",
    "heroText": "Calefacción para el invierno, aires para el verano y todo lo demás para el hogar. Armá tu selección en el catálogo y te pasamos la cotización por WhatsApp.",
    "heroImage": "assets/fachada-placeholder.jpg",
    "brands": [
      "Marca 1",
      "Marca 2",
      "Marca 3",
      "Marca 4",
      "Marca 5",
      "Marca 6",
      "Marca 7",
      "Marca 8"
    ]
  },
  "categories": [
    {
      "slug": "calefaccion",
      "name": "Calefacción",
      "icon": "heater",
      "image": "assets/productos/calefaccion.jpg",
      "highlight": true,
      "subcategories": [
        {
          "slug": "estufas-gas",
          "name": "Estufas a gas"
        },
        {
          "slug": "estufas-electricas",
          "name": "Estufas eléctricas"
        },
        {
          "slug": "tiro-balanceado",
          "name": "Calefactores tiro balanceado"
        },
        {
          "slug": "pantallas-infrarrojas",
          "name": "Pantallas infrarrojas"
        }
      ]
    },
    {
      "slug": "aires-acondicionados",
      "name": "Aires acondicionados",
      "icon": "ac",
      "image": "assets/productos/aires-acondicionados.jpg",
      "highlight": true,
      "subcategories": [
        {
          "slug": "split-frio-calor",
          "name": "Split frío/calor"
        },
        {
          "slug": "split-frio",
          "name": "Split solo frío"
        },
        {
          "slug": "portatiles",
          "name": "Portátiles"
        },
        {
          "slug": "ventana",
          "name": "Ventana"
        }
      ]
    },
    {
      "slug": "heladeras",
      "name": "Heladeras",
      "icon": "fridge",
      "image": "assets/productos/heladeras.jpg",
      "highlight": false,
      "subcategories": [
        {
          "slug": "con-freezer",
          "name": "Con freezer"
        },
        {
          "slug": "no-frost",
          "name": "No frost"
        },
        {
          "slug": "exhibidoras",
          "name": "Exhibidoras / comerciales"
        }
      ]
    },
    {
      "slug": "freezer",
      "name": "Freezer",
      "icon": "freezer",
      "image": "assets/productos/freezer.jpg",
      "highlight": false,
      "subcategories": [
        {
          "slug": "horizontal",
          "name": "Horizontal"
        },
        {
          "slug": "vertical",
          "name": "Vertical"
        }
      ]
    },
    {
      "slug": "lavarropas",
      "name": "Lavarropas",
      "icon": "washer",
      "image": "assets/productos/lavarropas.jpg",
      "highlight": false,
      "subcategories": [
        {
          "slug": "carga-frontal",
          "name": "Carga frontal"
        },
        {
          "slug": "carga-superior",
          "name": "Carga superior"
        }
      ]
    },
    {
      "slug": "secadoras",
      "name": "Secadoras",
      "icon": "dryer",
      "image": "assets/productos/secadoras.jpg",
      "highlight": false,
      "subcategories": []
    },
    {
      "slug": "lavavajillas",
      "name": "Lavavajillas",
      "icon": "dishwasher",
      "image": "assets/productos/lavavajillas.jpg",
      "highlight": false,
      "subcategories": []
    },
    {
      "slug": "coccion",
      "name": "Cocción",
      "icon": "stove",
      "image": "assets/productos/coccion.jpg",
      "highlight": false,
      "subcategories": [
        {
          "slug": "cocinas",
          "name": "Cocinas"
        },
        {
          "slug": "anafes",
          "name": "Anafes"
        }
      ]
    },
    {
      "slug": "campanas",
      "name": "Campanas",
      "icon": "hood",
      "image": "assets/productos/campanas.jpg",
      "highlight": false,
      "subcategories": []
    },
    {
      "slug": "termotanques",
      "name": "Termotanques",
      "icon": "waterheater",
      "image": "assets/productos/termotanques.jpg",
      "highlight": false,
      "subcategories": [
        {
          "slug": "a-gas",
          "name": "A gas"
        },
        {
          "slug": "electricos",
          "name": "Eléctricos"
        }
      ]
    },
    {
      "slug": "smart-tv",
      "name": "Smart TV",
      "icon": "tv",
      "image": "assets/productos/smart-tv.jpg",
      "highlight": false,
      "subcategories": []
    },
    {
      "slug": "colchones",
      "name": "Colchones",
      "icon": "mattress",
      "image": "assets/productos/colchones.jpg",
      "highlight": false,
      "subcategories": []
    },
    {
      "slug": "pequenos-electrodomesticos",
      "name": "Pequeños electrodomésticos",
      "icon": "blender",
      "image": "assets/productos/pequenos-electrodomesticos.jpg",
      "highlight": false,
      "subcategories": []
    },
    {
      "slug": "repuestos",
      "name": "Repuestos",
      "icon": "gear",
      "image": "assets/productos/repuestos.jpg",
      "highlight": false,
      "subcategories": [
        {
          "slug": "repuestos-heladera",
          "name": "Repuestos de heladera"
        },
        {
          "slug": "repuestos-aire",
          "name": "Repuestos de aire acondicionado"
        },
        {
          "slug": "repuestos-lavarropas",
          "name": "Repuestos de lavarropas"
        }
      ]
    }
  ],
  "products": [
    {
      "id": "p01",
      "name": "Heladera con freezer superior",
      "category": "heladeras",
      "subcategory": "con-freezer",
      "tag": "destacado",
      "active": true,
      "description": "Heladera con freezer de dos puertas, pensada para el consumo diario de una familia. Fría de manera pareja y no ocupa un espacio excesivo en la cocina.",
      "features": [
        "Capacidad aproximada: 320 litros",
        "Freezer superior independiente",
        "Estantes de vidrio templado",
        "Bajo consumo eléctrico",
        "Terminación blanca"
      ],
      "images": [
        "assets/productos/heladeras.jpg"
      ]
    },
    {
      "id": "p02",
      "name": "Heladera cíclica una puerta",
      "category": "heladeras",
      "subcategory": "",
      "tag": "",
      "active": true,
      "description": "Heladera compacta de una puerta, ideal para departamentos, oficinas o como segunda heladera.",
      "features": [
        "Capacidad aproximada: 190 litros",
        "Deshielo cíclico automático",
        "Balconera reforzada",
        "Terminación blanca o inox"
      ],
      "images": [
        "assets/productos/heladeras.jpg"
      ]
    },
    {
      "id": "p03",
      "name": "Freezer horizontal",
      "category": "freezer",
      "subcategory": "horizontal",
      "tag": "oferta",
      "active": true,
      "description": "Freezer horizontal de buena capacidad, pensado para guardar mercadería en cantidad sin ocupar mucho lugar en altura.",
      "features": [
        "Capacidad aproximada: 300 litros",
        "Tapa con cierre hermético",
        "Cesto organizador incluido",
        "Sistema de control de temperatura"
      ],
      "images": [
        "assets/productos/freezer.jpg"
      ]
    },
    {
      "id": "p04",
      "name": "Freezer vertical",
      "category": "freezer",
      "subcategory": "vertical",
      "tag": "",
      "active": true,
      "description": "Freezer vertical con cajones, para ordenar la mercadería por tipo y encontrar todo rápido.",
      "features": [
        "Capacidad aproximada: 220 litros",
        "Cajones deslizables",
        "Puerta reversible",
        "Terminación blanca"
      ],
      "images": [
        "assets/productos/freezer.jpg"
      ]
    },
    {
      "id": "p05",
      "name": "Lavarropas carga frontal",
      "category": "lavarropas",
      "subcategory": "carga-frontal",
      "tag": "destacado",
      "active": true,
      "description": "Lavarropas automático de carga frontal, con varios programas de lavado para distintos tipos de tela.",
      "features": [
        "Capacidad aproximada: 8 kg",
        "Múltiples programas de lavado",
        "Centrifugado de alta velocidad",
        "Visor de puerta",
        "Bajo nivel de ruido"
      ],
      "images": [
        "assets/productos/lavarropas.jpg"
      ]
    },
    {
      "id": "p06",
      "name": "Lavarropas carga superior",
      "category": "lavarropas",
      "subcategory": "carga-superior",
      "tag": "",
      "active": true,
      "description": "Lavarropas de carga superior, práctico para el uso diario y de fácil manejo.",
      "features": [
        "Capacidad aproximada: 7 kg",
        "Programas rápidos",
        "Tina de acero inoxidable",
        "Control mecánico"
      ],
      "images": [
        "assets/productos/lavarropas.jpg"
      ]
    },
    {
      "id": "p07",
      "name": "Secarropas a condensación",
      "category": "secadoras",
      "subcategory": "",
      "tag": "",
      "active": true,
      "description": "Secarropas que no necesita salida al exterior, ideal para completar el lavado en días de lluvia o poco sol.",
      "features": [
        "Capacidad aproximada: 6 kg",
        "Sistema por condensación",
        "Programas por tipo de tela",
        "Filtro de pelusa extraíble"
      ],
      "images": [
        "assets/productos/secadoras.jpg"
      ]
    },
    {
      "id": "p08",
      "name": "Lavavajillas empotrable",
      "category": "lavavajillas",
      "subcategory": "",
      "tag": "",
      "active": true,
      "description": "Lavavajillas para instalar bajo mesada, con varios programas según el nivel de suciedad de la vajilla.",
      "features": [
        "Capacidad para 12 cubiertos",
        "Programas eco y intensivo",
        "Cestos ajustables",
        "Bajo consumo de agua"
      ],
      "images": [
        "assets/productos/lavavajillas.jpg"
      ]
    },
    {
      "id": "p09",
      "name": "Cocina a gas de 4 hornallas",
      "category": "coccion",
      "subcategory": "cocinas",
      "tag": "",
      "active": true,
      "description": "Cocina a gas con horno y grill, pensada para el uso diario de una cocina familiar.",
      "features": [
        "4 hornallas con encendido eléctrico",
        "Horno con grill",
        "Tapa de vidrio templado",
        "Patas niveladoras"
      ],
      "images": [
        "assets/productos/coccion.jpg"
      ]
    },
    {
      "id": "p10",
      "name": "Anafe eléctrico dos hornallas",
      "category": "coccion",
      "subcategory": "anafes",
      "tag": "",
      "active": true,
      "description": "Anafe eléctrico compacto, práctico como cocina principal en espacios chicos o de apoyo en la cocina principal.",
      "features": [
        "2 hornallas eléctricas",
        "Perillas de control de temperatura",
        "Superficie de fácil limpieza",
        "Terminación en acero"
      ],
      "images": [
        "assets/productos/coccion.jpg"
      ]
    },
    {
      "id": "p11",
      "name": "Campana de cocina",
      "category": "campanas",
      "subcategory": "",
      "tag": "",
      "active": true,
      "description": "Campana extractora para instalar sobre la cocina, ayuda a mantener el aire y las paredes libres de grasa y humo.",
      "features": [
        "Extracción o recirculación",
        "Filtro de aluminio lavable",
        "Iluminación incorporada",
        "Varias velocidades de extracción"
      ],
      "images": [
        "assets/productos/campanas.jpg"
      ]
    },
    {
      "id": "p12",
      "name": "Aire acondicionado split frío/calor",
      "category": "aires-acondicionados",
      "subcategory": "split-frio-calor",
      "tag": "oferta",
      "active": true,
      "description": "Equipo split frío/calor para climatizar un ambiente durante todo el año, con control remoto incluido.",
      "features": [
        "3000 frigorías aproximadas",
        "Frío y calor",
        "Control remoto incluido",
        "Filtro purificador de aire",
        "Bajo nivel de ruido"
      ],
      "images": [
        "assets/productos/aires-acondicionados.jpg"
      ]
    },
    {
      "id": "p13",
      "name": "Calefactor tiro balanceado",
      "category": "calefaccion",
      "subcategory": "tiro-balanceado",
      "tag": "",
      "active": true,
      "description": "Calefactor a gas de tiro balanceado, toma el aire de afuera y expulsa los gases al exterior sin consumir el oxígeno del ambiente.",
      "features": [
        "Instalación con salida a pared",
        "Encendido piezoeléctrico",
        "Termostato regulable",
        "Apto para ambientes medianos"
      ],
      "images": [
        "assets/productos/calefaccion.jpg"
      ]
    },
    {
      "id": "p14",
      "name": "Termotanque a gas",
      "category": "termotanques",
      "subcategory": "a-gas",
      "tag": "",
      "active": true,
      "description": "Termotanque a gas para agua caliente en toda la casa, con pantalla piloto y buena recuperación.",
      "features": [
        "Capacidad aproximada: 80 litros",
        "Encendido piezoeléctrico",
        "Válvula de seguridad",
        "Apto gas natural o envasado"
      ],
      "images": [
        "assets/productos/termotanques.jpg"
      ]
    },
    {
      "id": "p15",
      "name": "Smart TV 50 pulgadas",
      "category": "smart-tv",
      "subcategory": "",
      "tag": "destacado",
      "active": true,
      "description": "Smart TV con aplicaciones integradas para mirar tus plataformas favoritas sin necesidad de otro dispositivo.",
      "features": [
        "Pantalla de 50 pulgadas",
        "Resolución 4K",
        "Wi-Fi integrado",
        "Control remoto con acceso directo a apps",
        "Varias entradas HDMI y USB"
      ],
      "images": [
        "assets/productos/smart-tv.jpg"
      ]
    },
    {
      "id": "p16",
      "name": "Colchón de resortes pocket",
      "category": "colchones",
      "subcategory": "",
      "tag": "",
      "active": true,
      "description": "Colchón de resortes independientes, se adapta al cuerpo y reduce el movimiento entre las dos plazas.",
      "features": [
        "Medida: 2 plazas (140x190 cm)",
        "Resortes pocket independientes",
        "Tela acolchada antialérgica",
        "Doble faz verano/invierno"
      ],
      "images": [
        "assets/productos/colchones.jpg"
      ]
    },
    {
      "id": "p17",
      "name": "Microondas con grill",
      "category": "pequenos-electrodomesticos",
      "subcategory": "",
      "tag": "",
      "active": true,
      "description": "Microondas con función grill, práctico para calentar, descongelar y dorar en pocos minutos.",
      "features": [
        "Capacidad aproximada: 25 litros",
        "Función grill",
        "Programas automáticos",
        "Plato giratorio de vidrio"
      ],
      "images": [
        "assets/productos/pequenos-electrodomesticos.jpg"
      ]
    },
    {
      "id": "p18",
      "name": "Burlete para heladera",
      "category": "repuestos",
      "subcategory": "repuestos-heladera",
      "tag": "",
      "active": true,
      "description": "Burlete de repuesto para puerta de heladera, ayuda a mantener el frío y bajar el consumo eléctrico. Consultanos el modelo de tu equipo.",
      "features": [
        "Varias medidas disponibles",
        "Consultar según marca y modelo",
        "Instalación sencilla",
        "Mejora el sellado de la puerta"
      ],
      "images": [
        "assets/productos/repuestos.jpg"
      ]
    },
    {
      "id": "p19",
      "name": "Motor de lavarropas",
      "category": "repuestos",
      "subcategory": "repuestos-lavarropas",
      "tag": "",
      "active": true,
      "description": "Motor de repuesto para lavarropas automático. Traé el dato de tu equipo o el motor usado y te asesoramos sobre el reemplazo.",
      "features": [
        "Consultar compatibilidad por marca y modelo",
        "Repuesto para carga frontal y superior",
        "Asesoramiento para el recambio",
        "Instalación no incluida"
      ],
      "images": [
        "assets/productos/repuestos.jpg"
      ]
    },
    {
      "id": "p20",
      "name": "Aire acondicionado split solo frío",
      "category": "aires-acondicionados",
      "subcategory": "split-frio",
      "tag": "nuevo",
      "active": true,
      "description": "Split solo frío para dormitorios o ambientes chicos. Enfría rápido y mantiene la temperatura estable sin hacer ruido.",
      "features": [
        "2250 frigorías aproximadas",
        "Modo sueño y temporizador",
        "Control remoto incluido",
        "Filtro lavable"
      ],
      "images": [
        "assets/productos/aires-acondicionados.jpg"
      ]
    },
    {
      "id": "p21",
      "name": "Aire acondicionado portátil",
      "category": "aires-acondicionados",
      "subcategory": "portatiles",
      "tag": "",
      "active": true,
      "description": "Equipo portátil con ruedas, para climatizar sin obra ni instalación: solo se apoya la manguera de salida en una ventana.",
      "features": [
        "Sin instalación fija",
        "Kit de ventana incluido",
        "Función deshumidificador",
        "Ruedas para moverlo de ambiente"
      ],
      "images": [
        "assets/productos/aires-acondicionados.jpg"
      ]
    },
    {
      "id": "p22",
      "name": "Aire acondicionado de ventana",
      "category": "aires-acondicionados",
      "subcategory": "ventana",
      "tag": "",
      "active": true,
      "description": "Equipo compacto que se instala en una ventana o en un hueco de pared. Una sola unidad, sin unidad exterior separada.",
      "features": [
        "Todo en una sola unidad",
        "Frío y ventilación",
        "Control mecánico o remoto según modelo",
        "Instalación sencilla"
      ],
      "images": [
        "assets/productos/aires-acondicionados.jpg"
      ]
    },
    {
      "id": "p23",
      "name": "Estufa a gas con salida al exterior",
      "category": "calefaccion",
      "subcategory": "estufas-gas",
      "tag": "oferta",
      "active": true,
      "description": "Estufa a gas con conducto de salida, para calefaccionar ambientes medianos de forma segura y económica.",
      "features": [
        "Salida de gases al exterior",
        "Válvula de seguridad",
        "Encendido piezoeléctrico",
        "Apto gas natural o envasado"
      ],
      "images": [
        "assets/productos/calefaccion.jpg"
      ]
    },
    {
      "id": "p24",
      "name": "Estufa eléctrica de cuarzo",
      "category": "calefaccion",
      "subcategory": "estufas-electricas",
      "tag": "",
      "active": true,
      "description": "Estufa eléctrica liviana, calienta al instante. Ideal para baños, dormitorios o como apoyo en días puntuales.",
      "features": [
        "Dos niveles de potencia",
        "Apagado de seguridad por vuelco",
        "Liviana y fácil de mover",
        "No necesita instalación"
      ],
      "images": [
        "assets/productos/calefaccion.jpg"
      ]
    },
    {
      "id": "p25",
      "name": "Panel calefactor infrarrojo",
      "category": "calefaccion",
      "subcategory": "pantallas-infrarrojas",
      "tag": "destacado",
      "active": true,
      "description": "Panel de pared que calefacciona por radiación infrarroja: no reseca el ambiente ni mueve polvo. Se instala como un cuadro.",
      "features": [
        "Montaje en pared",
        "Bajo consumo",
        "Superficie de baja temperatura",
        "Silencioso"
      ],
      "images": [
        "assets/productos/calefaccion.jpg"
      ]
    },
    {
      "id": "p26",
      "name": "Heladera no frost",
      "category": "heladeras",
      "subcategory": "no-frost",
      "tag": "",
      "active": true,
      "description": "Heladera no frost con freezer, sin escarcha ni descongelamiento manual. Mantiene el frío parejo en todos los estantes.",
      "features": [
        "Capacidad aproximada: 360 litros",
        "Sistema no frost",
        "Control de temperatura digital",
        "Terminación inox"
      ],
      "images": [
        "assets/productos/heladeras.jpg"
      ]
    },
    {
      "id": "p27",
      "name": "Capacitor para aire acondicionado",
      "category": "repuestos",
      "subcategory": "repuestos-aire",
      "tag": "",
      "active": true,
      "description": "Capacitor de arranque para compresor o ventilador de equipos split. Consultanos con la marca y el modelo de tu aire.",
      "features": [
        "Varias capacidades disponibles",
        "Consultar según marca y modelo",
        "Repuesto para unidad exterior e interior"
      ],
      "images": [
        "assets/productos/repuestos.jpg"
      ]
    }
  ]
};
