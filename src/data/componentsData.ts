export type ComponentId =
  | 'sai'
  | 'pdu'
  | 'router'
  | 'switch'
  | 'hub'
  | 'patch_panel'
  | 'pcs_roseta';

export interface EducationalComponent {
  id: ComponentId;
  nombre: string;
  subtitulo: string;
  unidadesU: string;
  queEs: string;
  paraQueSirve: string;
  dondeSeColoca: string;
  datoClave: string;
  notaEducativa?: {
    titulo: string;
    texto: string;
  };
}

export const EDUCATIONAL_COMPONENTS: EducationalComponent[] = [
  {
    id: 'sai',
    nombre: 'SAI (UPS)',
    subtitulo: 'Sistema de Alimentación Ininterrumpida',
    unidadesU: '2U · Muy pesado',
    queEs:
      'Es una batería grande con protección eléctrica que se conecta entre el enchufe de la pared y los equipos del armario rack.',
    paraQueSirve:
      'Si se va la luz o hay una subida de tensión en el aula, el SAI mantiene encendidos el router y el switch durante varios minutos para que no se corte la red ni se estropeen.',
    dondeSeColoca:
      'Siempre en la base del armario (unidades U1 y U2, abajo del todo). Como lleva baterías de plomo muy pesadas, ponerlo abajo evita que el armario pierda estabilidad o vuelque.',
    datoClave: 'Ocupa 2U de altura y soporta picos de corriente eléctrica.',
  },
  {
    id: 'pdu',
    nombre: 'Regleta PDU',
    subtitulo: 'Unidad de Distribución de Energía',
    unidadesU: '1U · Alimentación',
    queEs:
      'Es una regleta eléctrica profesional diseñada con orejetas metálicas para atornillarse directamente a las guías de un armario rack de 19 pulgadas.',
    paraQueSirve:
      'Reparte la corriente eléctrica (normalmente desde el SAI) hacia todos los equipos del armario: router, switch y otros dispositivos.',
    dondeSeColoca:
      'En una unidad 1U accesible del rack (por ejemplo en U3 o en la zona superior U11–U12), dejando espacio cómodo para enchufar y desenchufar los cables de corriente.',
    datoClave: 'Incluye interruptor general protegido para evitar apagones accidentales.',
  },
  {
    id: 'router',
    nombre: 'Router de operadora',
    subtitulo: 'Enrutador de acceso a Internet',
    unidadesU: '1U o sobre bandeja',
    queEs:
      'Es el equipo que nos instala la compañía de telecomunicaciones (operadora) para darnos salida al exterior.',
    paraQueSirve:
      'Une nuestra red local del aula con Internet. Tiene un puerto WAN (donde entra la fibra óptica de la calle) y puertos LAN (para enviar la red al switch del rack).',
    dondeSeColoca:
      'En la zona media o alta del rack. Si es un router doméstico o de oficina sin fijación a 19", se apoya sobre una bandeja metálica 1U.',
    datoClave: 'Traduce las direcciones privadas del aula para navegar por Internet.',
  },
  {
    id: 'switch',
    nombre: 'Switch de 24 puertos',
    subtitulo: 'Conmutador de red inteligente',
    unidadesU: '1U · Red local',
    queEs:
      'Es el cerebro que reparte los datos dentro de la red local del aula. Tiene 24 puertos RJ45 numerados y LEDs que indican actividad.',
    paraQueSirve:
      'Lee la dirección física (MAC) de cada paquete de datos y lo envía únicamente al puerto del ordenador destino, evitando atascos y choques en la red.',
    dondeSeColoca:
      'Justo al lado (adyacente) del Patch Panel. Así podemos unir ambos equipos con latiguillos Ethernet muy cortos, limpios y fáciles de mantener.',
    datoClave: 'Trabaja a máxima velocidad sin colisiones entre equipos.',
  },
  {
    id: 'hub',
    nombre: 'Hub de 8 puertos',
    subtitulo: 'Concentrador antiguo (en desuso)',
    unidadesU: '1U · Tecnología antigua',
    queEs:
      'Es un dispositivo de red antiguo muy parecido por fuera a un switch sencillo, pero sin inteligencia electrónica para decidir a quién van los datos.',
    paraQueSirve:
      'Cuando recibe información por un puerto, la copia y la repite a todos los demás puertos a la vez, aunque los otros ordenadores no la hayan pedido.',
    dondeSeColoca:
      'Antiguamente iba en el rack o sobre la mesa del aula; hoy en día solo se estudia en prácticas de clase para entender su funcionamiento y limitaciones.',
    datoClave: 'Comparte el mismo ancho de banda entre todos los puertos conectados.',
    notaEducativa: {
      titulo: '¿Por qué hoy se sustituye el Hub por el Switch?',
      texto:
        'Porque el Hub envía todos los mensajes a todos los ordenadores a la vez: si dos PCs hablan al mismo tiempo, se producen colisiones, la red se vuelve muy lenta y cualquiera puede ver los datos de los demás. El Switch solo envía el paquete al ordenador destino, eliminando las colisiones y multiplicando la velocidad.',
    },
  },
  {
    id: 'patch_panel',
    nombre: 'Patch Panel de 24 puertos',
    subtitulo: 'Panel de parcheo estructurado',
    unidadesU: '1U · Cableado estructurado',
    queEs:
      'Es una regleta pasiva (no lleva corriente eléctrica) con 24 tomas hembra RJ45 por delante y bornes de conexión por detrás.',
    paraQueSirve:
      'Recoge y ordena por la parte trasera los cables rígidos que vienen empotrados por las canaletas desde las rosetas de pared del aula, evitando que se doblen o se rompan al mover el rack.',
    dondeSeColoca:
      'Justo encima o debajo del Switch (adyacentes), para conectar cada puerto numerado del aula al Switch mediante latiguillos flexibles cortos.',
    datoClave: 'No necesita enchufe eléctrico: solo ordena y protege el cableado fijo.',
  },
  {
    id: 'pcs_roseta',
    nombre: 'Ordenadores de aula y Roseta RJ45',
    subtitulo: 'Puestos de trabajo (PC1 a PC4)',
    unidadesU: 'Puestos del aula',
    queEs:
      'Son los equipos informáticos que usan los alumnos y la toma de pared (roseta RJ45) que hay junto a cada mesa.',
    paraQueSirve:
      'Cada ordenador se conecta con un cable Ethernet azul desde su tarjeta de red hasta la roseta de la pared. Por dentro de la pared, ese cable llega hasta el Patch Panel del armario rack.',
    dondeSeColoca:
      'Los PCs sobre las mesas del aula y las rosetas fijadas en la pared o canaleta eléctrica junto a cada puesto de trabajo.',
    datoClave: 'Cada roseta lleva una etiqueta numérica que coincide con el Patch Panel.',
  },
];

export type RackEquipmentId =
  | 'sai'
  | 'pdu'
  | 'router'
  | 'patch_panel'
  | 'switch'
  | 'bandeja';

export interface RackEquipmentSpec {
  id: RackEquipmentId;
  nombre: string;
  descripcionCorta: string;
  heightU: 1 | 2;
  svgComponent: ComponentId | 'bandeja';
}

export const RACK_INVENTORY: RackEquipmentSpec[] = [
  {
    id: 'sai',
    nombre: 'SAI (UPS)',
    descripcionCorta: 'Batería pesada de respaldo eléctrico',
    heightU: 2,
    svgComponent: 'sai',
  },
  {
    id: 'pdu',
    nombre: 'Regleta PDU',
    descripcionCorta: 'Distribuidor de tomas de corriente',
    heightU: 1,
    svgComponent: 'pdu',
  },
  {
    id: 'bandeja',
    nombre: 'Bandeja metálica',
    descripcionCorta: 'Soporte fijo para apoyar equipos',
    heightU: 1,
    svgComponent: 'bandeja',
  },
  {
    id: 'router',
    nombre: 'Router de operadora',
    descripcionCorta: 'Conexión WAN a Internet y LAN',
    heightU: 1,
    svgComponent: 'router',
  },
  {
    id: 'patch_panel',
    nombre: 'Patch Panel 24p',
    descripcionCorta: 'Ordena los cables de las rosetas',
    heightU: 1,
    svgComponent: 'patch_panel',
  },
  {
    id: 'switch',
    nombre: 'Switch 24p',
    descripcionCorta: 'Reparte datos a los puestos del aula',
    heightU: 1,
    svgComponent: 'switch',
  },
];

export const TOTAL_RACK_UNITS = 12;

export interface ComponentQuizOption {
  id: 'a' | 'b' | 'c';
  text: string;
  isCorrect: boolean;
  wrongHint: string;
}

export interface ComponentQuizItem {
  componentId: ComponentId;
  question: string;
  options: ComponentQuizOption[];
}

export const PHASE1_QUIZ_BY_COMPONENT: Record<ComponentId, ComponentQuizItem> = {
  sai: {
    componentId: 'sai',
    question: '¿Para qué sirve este equipo en un armario rack?',
    options: [
      {
        id: 'a',
        text: 'Repartir los paquetes de datos entre los 24 ordenadores del aula sin colisiones.',
        isCorrect: false,
        wrongHint:
          'Esa es la función del Switch. Fíjate en la pantalla LCD de 230V y los enchufes traseros de este aparato.',
      },
      {
        id: 'b',
        text: 'Proteger frente a cortes de luz y subidas de tensión manteniendo encendidos los equipos con su batería.',
        isCorrect: true,
        wrongHint: '',
      },
      {
        id: 'c',
        text: 'Ordenar por detrás los cables rígidos que vienen empotrados desde las rosetas de pared.',
        isCorrect: false,
        wrongHint:
          'Ordenar cables rígidos de pared es tarea del Patch Panel. Este equipo lleva baterías muy pesadas y da 230V.',
      },
    ],
  },
  pdu: {
    componentId: 'pdu',
    question: '¿Cuál es la función principal de este dispositivo?',
    options: [
      {
        id: 'a',
        text: 'Distribuir corriente eléctrica de 230V a varios equipos del rack con un interruptor general protegido.',
        isCorrect: true,
        wrongHint: '',
      },
      {
        id: 'b',
        text: 'Conectar la red local del aula con Internet mediante un puerto WAN de operadora.',
        isCorrect: false,
        wrongHint:
          'Conectar la red local con Internet es tarea del Router. Observa que este módulo tiene tomas eléctricas Schuko.',
      },
      {
        id: 'c',
        text: 'Repetir las tramas de red a todos los puertos a la vez provocando colisiones.',
        isCorrect: false,
        wrongHint:
          'Repetir datos a todos los puertos lo hacía el antiguo Hub. Este dispositivo distribuye energía eléctrica.',
      },
    ],
  },
  router: {
    componentId: 'router',
    question: '¿Qué misión cumple este equipo en la instalación del centro?',
    options: [
      {
        id: 'a',
        text: 'Servir únicamente de batería de respaldo cuando salta el diferencial del aula.',
        isCorrect: false,
        wrongHint:
          'La batería de respaldo es el SAI (UPS). Fíjate en el puerto amarillo WAN y los puertos azules L1–L4.',
      },
      {
        id: 'b',
        text: 'Sujetar físicamente los cables sobrantes del rack sin electrónica activa.',
        isCorrect: false,
        wrongHint:
          'Eso sería un pasahilos o bandeja. Este equipo enruta el tráfico entre la calle e Internet y la red local.',
      },
      {
        id: 'c',
        text: 'Unir nuestra red local del centro con Internet usando su entrada WAN y su salida LAN.',
        isCorrect: true,
        wrongHint: '',
      },
    ],
  },
  switch: {
    componentId: 'switch',
    question: '¿Cómo trabaja este equipo dentro de la red local?',
    options: [
      {
        id: 'a',
        text: 'Lee cada paquete y lo envía únicamente al puerto del equipo destino, evitando colisiones.',
        isCorrect: true,
        wrongHint: '',
      },
      {
        id: 'b',
        text: 'Reenvía siempre todos los datos a todos los puertos a la vez aunque nadie los haya pedido.',
        isCorrect: false,
        wrongHint:
          'Cuidado: reenviar todo a todos los puertos es lo que hacía el antiguo Hub. El Switch conmuta de forma inteligente.',
      },
      {
        id: 'c',
        text: 'Transforma los 230V de la pared en corriente continua de batería para el rack.',
        isCorrect: false,
        wrongHint:
          'De la corriente eléctrica se encargan el SAI y la regleta PDU; este equipo tiene 24 puertos RJ45 de datos.',
      },
    ],
  },
  hub: {
    componentId: 'hub',
    question: '¿Por qué este equipo antiguo se sustituyó hoy en día?',
    options: [
      {
        id: 'a',
        text: 'Porque solo funcionaba con fibra óptica y no admitía cables RJ45 de cobre.',
        isCorrect: false,
        wrongHint:
          'El Hub sí usaba cables RJ45. Su problema es cómo repite la señal por todos sus puertos.',
      },
      {
        id: 'b',
        text: 'Porque repite todos los datos a todos los puertos a la vez, provocando colisiones y lentitud.',
        isCorrect: true,
        wrongHint: '',
      },
      {
        id: 'c',
        text: 'Porque ocupaba 6 unidades U en el rack y no cabía junto al SAI.',
        isCorrect: false,
        wrongHint:
          'El Hub ocupaba solo 1U igual que un Switch. El motivo real de su desuso son las colisiones de red.',
      },
    ],
  },
  patch_panel: {
    componentId: 'patch_panel',
    question: '¿Qué función tiene este panel pasivo en el armario rack?',
    options: [
      {
        id: 'a',
        text: 'Asignar direcciones IP automáticas a cada ordenador que se enciende en el aula.',
        isCorrect: false,
        wrongHint:
          'Un Patch Panel no tiene electrónica ni corriente eléctrica; las direcciones IP las gestiona el Router/servidor.',
      },
      {
        id: 'b',
        text: 'Proteger los ordenadores frente a picos de tensión eléctrica de la red del edificio.',
        isCorrect: false,
        wrongHint:
          'La protección eléctrica la realiza el SAI. Este panel tiene tomas RJ45 numeradas para el cableado de las aulas.',
      },
      {
        id: 'c',
        text: 'Recoger y ordenar de forma fija los cables rígidos que llegan desde las rosetas de pared del aula.',
        isCorrect: true,
        wrongHint: '',
      },
    ],
  },
  pcs_roseta: {
    componentId: 'pcs_roseta',
    question: '¿Cómo se conectan los puestos del aula con el armario rack?',
    options: [
      {
        id: 'a',
        text: 'Cada PC se conecta con cable Ethernet a su roseta de pared, que viaja por canaleta hasta el Patch Panel.',
        isCorrect: true,
        wrongHint: '',
      },
      {
        id: 'b',
        text: 'Cada PC se enchufa directamente al SAI del armario rack mediante un cable eléctrico de 230V.',
        isCorrect: false,
        wrongHint:
          'El SAI protege el rack, pero la señal de red de los ordenadores viaja por cable UTP hasta la roseta de pared.',
      },
      {
        id: 'c',
        text: 'La roseta de pared envía la señal directamente al puerto WAN de la operadora sin pasar por el Switch.',
        isCorrect: false,
        wrongHint:
          'Las rosetas llegan al Patch Panel y de ahí mediante latiguillos cortos al Switch del aula.',
      },
    ],
  },
};

export type TechnicalRackEquipmentId =
  | 'sai'
  | 'pdu'
  | 'router'
  | 'bandeja'
  | 'pasahilos'
  | 'patch_panel_1'
  | 'switch_1'
  | 'patch_panel_2'
  | 'switch_2'
  | 'patch_panel_3'
  | 'switch_3';

export interface TechnicalRackEquipmentSpec {
  id: TechnicalRackEquipmentId;
  category: 'sai' | 'pdu' | 'router' | 'bandeja' | 'pasahilos' | 'patch_panel' | 'switch';
  nombre: string;
  descripcionCorta: string;
  heightU: 1 | 2;
  svgComponent: ComponentId | 'bandeja' | 'pasahilos';
  badgeLabel?: string;
}

// 11 items = 2 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 = 12U completas
export const TECHNICAL_RACK_INVENTORY: TechnicalRackEquipmentSpec[] = [
  {
    id: 'sai',
    category: 'sai',
    nombre: 'SAI (UPS)',
    descripcionCorta: 'Batería pesada · Base U1–U2',
    heightU: 2,
    svgComponent: 'sai',
  },
  {
    id: 'pdu',
    category: 'pdu',
    nombre: 'Regleta PDU',
    descripcionCorta: 'Tomas eléctricas 230V del rack',
    heightU: 1,
    svgComponent: 'pdu',
  },
  {
    id: 'patch_panel_1',
    category: 'patch_panel',
    nombre: 'Patch Panel 1 (Aula 1)',
    descripcionCorta: 'Cableado estructurado Aula 1',
    heightU: 1,
    svgComponent: 'patch_panel',
    badgeLabel: 'PP1',
  },
  {
    id: 'switch_1',
    category: 'switch',
    nombre: 'Switch 1 · Principal (24p)',
    descripcionCorta: 'Conmutador troncal + Aula 1',
    heightU: 1,
    svgComponent: 'switch',
    badgeLabel: 'SW1',
  },
  {
    id: 'patch_panel_2',
    category: 'patch_panel',
    nombre: 'Patch Panel 2 (Aula 2)',
    descripcionCorta: 'Cableado estructurado Aula 2',
    heightU: 1,
    svgComponent: 'patch_panel',
    badgeLabel: 'PP2',
  },
  {
    id: 'switch_2',
    category: 'switch',
    nombre: 'Switch 2 · Aula 2 (24p)',
    descripcionCorta: 'Conmutador de red Aula 2',
    heightU: 1,
    svgComponent: 'switch',
    badgeLabel: 'SW2',
  },
  {
    id: 'patch_panel_3',
    category: 'patch_panel',
    nombre: 'Patch Panel 3 (Prof.)',
    descripcionCorta: 'Tomas Sala de Profesores',
    heightU: 1,
    svgComponent: 'patch_panel',
    badgeLabel: 'PP3',
  },
  {
    id: 'switch_3',
    category: 'switch',
    nombre: 'Switch 3 · Prof. (24p)',
    descripcionCorta: 'Conmutador Sala de Profesores',
    heightU: 1,
    svgComponent: 'switch',
    badgeLabel: 'SW3',
  },
  {
    id: 'pasahilos',
    category: 'pasahilos',
    nombre: 'Pasahilos 1U',
    descripcionCorta: 'Guía frontal para ordenar cables',
    heightU: 1,
    svgComponent: 'pasahilos',
  },
  {
    id: 'bandeja',
    category: 'bandeja',
    nombre: 'Bandeja metálica 1U',
    descripcionCorta: 'Soporte fijo para equipos',
    heightU: 1,
    svgComponent: 'bandeja',
  },
  {
    id: 'router',
    category: 'router',
    nombre: 'Router de operadora',
    descripcionCorta: 'Acometida externa (zona superior)',
    heightU: 1,
    svgComponent: 'router',
  },
];
