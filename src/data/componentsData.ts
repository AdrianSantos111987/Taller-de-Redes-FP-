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
