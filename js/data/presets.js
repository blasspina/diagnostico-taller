/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Realistic Diagnostic Trees for Electronics Engineering
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

const PRESET_TREES = [
  {
    id: 'celular_no_enciende_fuente',
    name: 'Celular No Enciende (Diagnóstico con Fuente de Laboratorio)',
    deviceType: 'Smartphone Android / iPhone (Placa Lógica)',
    description: 'Protocolo integral de banco con fuente de laboratorio regulada: análisis de consumos iniciales antes de presionar Power (corto directo en VBAT/VPH_PWR vs fuga pasiva), consumos fijos tras presionar Power (falla en PMIC, oscilación XTAL o bloqueo de bus I2C) y caídas instantáneas a cero.',
    nodes: [
      {
        id: 'cne_start',
        title: 'Conexión a Fuente de Laboratorio: Consumo Inicial Antes de Presionar Power',
        category: 'symptom',
        description: 'Configurar la fuente de laboratorio en 4.20V DC y protección de corriente (OCP / CC) en 2.0A - 3.0A. Conectar el cable pulpo / conector FPC al borne positivo de batería (VBAT) y chasis a GND. Observar el amperímetro ANTES de presionar el botón de encendido (PWR_KEY).',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: '0.000 A (0 mA) en estado de reposo absoluto',
            tolerance: 'Hasta 0.002 A (2 mA) máximo por carga inicial de capacitores de entrada',
            referenceValues: {
              diodeDrop: 'VBAT: 0.420V - 0.520V | VPH_PWR: 0.350V - 0.460V',
              nominalVoltage: '4.20V DC estables en bornes',
              usbCurrent: 'Evaluación en fuente de banco DC'
            }
          }
        ],
        technicalTips: 'Cualquier consumo previo a pulsar Power confirma una anomalía en las líneas primarias siempre alimentadas (VBAT, VPH_PWR, VDD_MAIN o VSYS) o en los LDO de standby del PMIC.',
        options: [
          {
            label: 'Corto Directo (> 2.0A): La fuente cae de voltaje y activa protección CC de inmediato',
            targetNodeId: 'cne_short_vbat_vs_vph',
            badgeColor: 'red'
          },
          {
            label: 'Fuga Inicial sin presionar Power: Consumo fijo o fluctuante entre 10mA y 450mA',
            targetNodeId: 'cne_initial_leakage_analysis',
            badgeColor: 'yellow'
          },
          {
            label: 'Consumo Inicial Normal (0.000A): Proceder a presionar el botón Power (PWR_KEY)',
            targetNodeId: 'cne_after_power_press',
            badgeColor: 'green'
          }
        ]
      },
      {
        id: 'cne_short_vbat_vs_vph',
        title: 'Aislamiento del Corto Primario: Riel VBAT vs Riel Principal VPH_PWR / VDD_MAIN',
        category: 'measurement',
        description: 'Desconectar la fuente. Con el multímetro en Modo Diodo (punta roja a blindaje GND y punta negra a medir), verificar la caída de tensión en el pin positivo del conector de batería (VBAT) y en la bobina o condensadores de salida del IF PMIC (VPH_PWR / VDD_MAIN / VSYS).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'VBAT: 0.420V - 0.520V | VPH_PWR / VDD_MAIN: 0.340V - 0.450V',
            tolerance: '0.000V - 0.005V confirma cortocircuito directo a tierra en ese riel',
            referenceValues: {
              diodeDrop: 'VBAT ~480mV | VPH_PWR ~380mV',
              nominalVoltage: '0.00V (Medición sin energía)',
              usbCurrent: '0.00A'
            }
          }
        ],
        technicalTips: 'El IF PMIC (o MOSFET conmutador de batería) separa VBAT de VPH_PWR/VDD_MAIN. Si VBAT mide normal (~0.450V) pero VPH_PWR mide 0.000V, el corto está en la línea principal del sistema detrás del IF PMIC.',
        options: [
          {
            label: '0.000V directos en conector VBAT (Corto en entrada de batería)',
            targetNodeId: 'cne_vbat_direct_short',
            badgeColor: 'red'
          },
          {
            label: 'VBAT mide bien (> 0.380V) pero VPH_PWR / VDD_MAIN está en 0.000V (Corto en línea principal)',
            targetNodeId: 'cne_vph_pwr_thermal_injection',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_vbat_direct_short',
        title: 'Inspección y Diagnóstico de Corto en Línea Primaria VBAT',
        category: 'inspection',
        description: 'El corto se aloja directamente a la entrada del conector de batería. Inspeccionar bajo microscopio y con técnica de rocío de resina colofonia (Rosin) o cámara térmica el diodo supresor TVS de batería, capacitores de filtro VBAT y el circuito integrado de carga (IF PMIC).',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Disipación térmica inmediata al inyectar 1.5V - 2.0V (máx 2A) en VBAT',
            tolerance: 'El componente en corto se calienta a > 50°C en menos de 2 segundos',
            referenceValues: {
              diodeDrop: '0.000V antes de retirar / 0.460V tras retirar componente en corto',
              nominalVoltage: 'Inyección controlada 1.5V - 2.0V',
              usbCurrent: '2.00A en inyección'
            }
          }
        ],
        technicalTips: 'En el 80% de los casos de corto directo en VBAT, el culpable es el diodo TVS de protección contra inversión de polaridad o un capacitor MLCC junto al conector FPC.',
        options: [
          {
            label: 'Se calienta el Diodo TVS de protección o un capacitor cerámico MLCC en VBAT',
            targetNodeId: 'cne_verdict_vbat_tvs_cap',
            badgeColor: 'green'
          },
          {
            label: 'Se calienta directamente el IC de Carga / IF PMIC (Conmutador interno perforado)',
            targetNodeId: 'cne_verdict_if_pmic_short',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_vph_pwr_thermal_injection',
        title: 'Inyección de Tensión en Línea Principal (VPH_PWR / VDD_MAIN)',
        category: 'action',
        description: 'Soldar un cable de prueba en un pad o capacitor de la línea VPH_PWR / VDD_MAIN. Aplicar humo de colofonia (Rosin) sobre las zonas sin blindaje (etapa RF, Backlight, PMIC, Audio) o enfocar con cámara térmica e inyectar 2.0V a 3.5V gradualmente con corriente limitada a 2.5A.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Punto focal único de alta emisión infrarroja (Hotspot)',
            tolerance: 'No superar 4.0V en la inyección sobre VPH_PWR',
            referenceValues: {
              diodeDrop: '0.000V en corto -> debe recuperar 0.360V - 0.440V',
              nominalVoltage: '2.0V a 3.8V inyección directa en VPH_PWR',
              usbCurrent: '1.8A - 2.5A durante localización'
            }
          }
        ],
        technicalTips: 'No confundir el calentamiento leve del cable de inyección con el componente en corto: el verdadero culpable derretirá el humo blanco de rosin de forma instantánea.',
        options: [
          {
            label: 'Un capacitor cerámico MLCC de filtrado en VPH_PWR / VDD_MAIN funde el rosin de inmediato',
            targetNodeId: 'cne_verdict_vph_mlcc_short',
            badgeColor: 'green'
          },
          {
            label: 'Calienta el Amplificador de Potencia de Radiofrecuencia (PA RF / 4G / 5G)',
            targetNodeId: 'cne_verdict_rf_pa_short',
            badgeColor: 'yellow'
          },
          {
            label: 'Calienta el PMIC Principal o Driver de Backlight / Audio Codec',
            targetNodeId: 'cne_verdict_pmic_or_subic_short',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_initial_leakage_analysis',
        title: 'Análisis de Fuga Inicial antes de Pulsar Power (10mA a 450mA)',
        category: 'measurement',
        description: 'La placa presenta un consumo parásito sin presionar el botón de encendido. Clasificar la magnitud de la fuga en la fuente de laboratorio y verificar si alguna bobina secundaria del PMIC o IF PMIC tiene caída de tensión alterada.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Clasificación: Fuga Baja (10mA - 70mA) vs Fuga Media/Alta (80mA - 450mA)',
            tolerance: 'Fugas > 100mA son detectables con cámara térmica o alcohol isopropílico',
            referenceValues: {
              diodeDrop: 'Revisar bobinas BUCK y LDO alrededor de PMIC (0.250V - 0.500V)',
              nominalVoltage: '4.20V en fuente',
              usbCurrent: '0.01A - 0.45A en reposo'
            }
          }
        ],
        technicalTips: 'Una fuga fija de 120mA - 250mA antes de dar power es típica de un IF PMIC / Tristar / Hydra dañado por cargador genérico, o de un capacitor con fuga resistiva (no llega a 0Ω pero drena corriente).',
        options: [
          {
            label: 'Fuga de 80mA - 350mA localizada térmicamente en IF PMIC / Controlador USB (Tristar/Hydra)',
            targetNodeId: 'cne_verdict_if_pmic_short',
            badgeColor: 'yellow'
          },
          {
            label: 'Fuga baja (10mA - 70mA) por sulfatación / humedad en periféricos o capacitor en fuga parcial',
            targetNodeId: 'cne_verdict_leakage_cap_corrosion',
            badgeColor: 'green'
          }
        ]
      },
      {
        id: 'cne_after_power_press',
        title: 'Curva de Consumo en Fuente Tras Presionar Botón Power (PWR_KEY)',
        category: 'measurement',
        description: 'Con 0.000A en reposo, presionar el botón de encendido (o puentear el testpoint PWR_KEY a GND con pinza durante 2 segundos) y analizar el comportamiento exacto de la corriente en la fuente de laboratorio.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Arranque normal: 60mA -> 140mA -> 280mA -> 650mA+ oscilando dinámicamente',
            tolerance: 'Consumos fijos o caídas a 0.000A indican interrupción de la secuencia de Boot',
            referenceValues: {
              diodeDrop: 'PWR_KEY: 0.420V - 0.600V',
              nominalVoltage: 'PWR_KEY: 1.80V (o 3.8V) en reposo -> 0.00V al pulsar',
              usbCurrent: 'Variable según etapa de inicialización'
            }
          }
        ],
        technicalTips: 'La lectura de miliamperios tras pulsar Power es el electrocardiograma de la placa lógica: indica si falló el botón, el PMIC, el reloj XTAL, el bus I2C, la memoria RAM/UFS o la CPU.',
        options: [
          {
            label: 'Consumo FIJO bajo (30mA a 90mA clavados): Falla en PMIC, Oscilación XTAL o Bus I2C',
            targetNodeId: 'cne_fixed_low_current_check',
            badgeColor: 'yellow'
          },
          {
            label: 'Consumo FIJO medio (110mA a 220mA clavados): Bloqueo en inicialización de RAM / Memoria UFS-eMMC',
            targetNodeId: 'cne_fixed_mid_memory_check',
            badgeColor: 'yellow'
          },
          {
            label: 'Cae a Cero (Sube a 40mA-160mA al pulsar y cae a 0.000A al soltar Power)',
            targetNodeId: 'cne_drop_to_zero_check',
            badgeColor: 'red'
          },
          {
            label: '0.000A absoluto (No reacciona en absoluto al presionar el botón de encendido)',
            targetNodeId: 'cne_zero_reaction_pwrkey',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_fixed_low_current_check',
        title: 'Diagnóstico de Consumo Fijo (30mA - 90mA): PMIC, Oscilación XTAL y Protocolo I2C',
        category: 'measurement',
        description: 'Un consumo fijo entre 30mA y 90mA indica que el PMIC activó sus rieles primarios pero el procesador detuvo el arranque antes de cargar el bootloader secundario. Verificar: 1) Líneas de protocolo I2C (SDA/SCL), 2) Oscilación del cristal maestro XTAL (38.4MHz / 26MHz) y 3) Salidas LDO/BUCK del PMIC.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.80V estables en líneas I2C (SDA/SCL) y 1.80V en VIO / LDOs de PMIC',
            tolerance: 'Si una línea I2C mide < 1.2V o 0V, está bloqueando el bus de control',
            referenceValues: {
              diodeDrop: 'I2C SDA/SCL: 0.450V - 0.580V simétricos',
              nominalVoltage: '1.80V Pull-Up en I2C | 0.8V - 1.1V en BUCKs de PMIC',
              usbCurrent: '0.04A - 0.09A fijos en fuente'
            }
          },
          {
            tool: 'Osciloscopio',
            expected: 'Señal de reloj limpia de 38.4MHz / 26MHz en XTAL y tren de datos en I2C',
            tolerance: 'Ausencia de reloj en XTAL congela el consumo en ~40mA-60mA'
          }
        ],
        technicalTips: 'Tip de taller: Desconectar todos los flexores periféricos (cámaras, sensores, sub-placa, pantalla) y probar solo la placa desnuda. Un periférico en corto en el bus I2C_SDA o I2C_SCL suele clavar el consumo en ~60mA.',
        options: [
          {
            label: 'Línea de protocolo I2C (SDA o SCL) caída a 0V o desbalanceada (Periférico o Pull-up en falla)',
            targetNodeId: 'cne_verdict_i2c_bus_fault',
            badgeColor: 'green'
          },
          {
            label: 'Cristal Oscilador Maestro (XTAL) sin frecuencia de oscilación o dañado por golpe',
            targetNodeId: 'cne_verdict_xtal_oscillator_fault',
            badgeColor: 'yellow'
          },
          {
            label: 'Falta un riel BUCK/LDO de salida del PMIC Principal o el PMIC se recalienta',
            targetNodeId: 'cne_verdict_pmic_sequence_fault',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_fixed_mid_memory_check',
        title: 'Diagnóstico de Consumo Fijo (110mA - 220mA): Memoria RAM / UFS / eMMC y Puerto USB',
        category: 'measurement',
        description: 'Con el consumo clavado entre 110mA y 220mA, conectar la placa por USB a la PC y verificar en el Administrador de Dispositivos si genera puerto de emergencia (Qualcomm QDLoader 9008, MediaTek USB Port VCOM o Exynos/Apple DFU). Medir tensiones de alimentación de memoria VCC (2.8V/3.0V), VCCQ (1.8V) y VDDQ RAM (1.1V/1.2V).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VCC: 2.85V - 3.00V | VCCQ: 1.80V | VDD_RAM: 1.10V / 1.20V',
            tolerance: '±5% en todos los rieles de alimentación de memoria',
            referenceValues: {
              diodeDrop: 'Rieles de memoria: 0.320V - 0.480V',
              nominalVoltage: '2.9V VCC / 1.8V VCCQ / 1.1V RAM',
              usbCurrent: 'Reconocimiento de puerto 9008 / VCOM / DFU en PC'
            }
          }
        ],
        technicalTips: 'Si la PC detecta puerto 9008 / VCOM / DFU directo sin hacer testpoint, el procesador (CPU) está vivo y funcionando, pero no logra leer las particiones de arranque de la memoria UFS/eMMC o inicializar la RAM.',
        options: [
          {
            label: 'PC detecta puerto 9008 / VCOM / DFU: Falla de Firmware, Memoria UFS/eMMC degradada o LDO ausente',
            targetNodeId: 'cne_verdict_nand_ufs_fault',
            badgeColor: 'yellow'
          },
          {
            label: 'Reacciona al ejercer leve presión sobre el CPU/RAM (Fisura de esferas BGA por golpe)',
            targetNodeId: 'cne_verdict_cpu_ram_reballing',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_drop_to_zero_check',
        title: 'Diagnóstico de Caída a Cero al Soltar Power (Falta de Auto-Sostén / Power Hold)',
        category: 'measurement',
        description: 'Al presionar Power el consumo sube (ej. 50mA - 150mA), pero al soltar el botón cae inmediatamente a 0.000A. Esto ocurre cuando el PMIC detecta un cortocircuito en una de sus bobinas BUCK secundarias (protección OCP) o cuando la CPU no devuelve la señal de confirmación PS_HOLD / WATCHDOG (1.8V).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Bobinas BUCK de PMIC: 0.220V - 0.450V (VCORE/VGFX: 0.020V - 0.085V normal)',
            tolerance: '0.000V absoluto en cualquier bobina BUCK o LDO desactiva el PMIC al instante',
            referenceValues: {
              diodeDrop: 'VCORE: 20-85mV | VMEM/VIO: 280-450mV | PS_HOLD: 450mV',
              nominalVoltage: 'PS_HOLD / PWRHOLD debe subir a 1.80V al pulsar Power',
              usbCurrent: 'Caída inmediata a 0.000A al soltar botón'
            }
          }
        ],
        technicalTips: 'Medir primero todas las bobinas alrededor del PMIC principal en modo diodo. Si una bobina secundaria (como VIO_1V8 o VREG_S4) está en corto a tierra, el PMIC intenta arrancar y se apaga de inmediato al soltar el botón.',
        options: [
          {
            label: 'Una bobina secundaria BUCK o salida LDO del PMIC mide 0.000V (Corto en línea secundaria)',
            targetNodeId: 'cne_verdict_secondary_rail_short',
            badgeColor: 'red'
          },
          {
            label: 'Bobinas miden bien, pero falta señal PS_HOLD (1.8V) o el PMIC no retiene el enclavamiento',
            targetNodeId: 'cne_verdict_pmic_sequence_fault',
            badgeColor: 'yellow'
          },
          {
            label: 'Al presionar mecánicamente el CPU/RAM el consumo se sostiene y logra encender',
            targetNodeId: 'cne_verdict_cpu_ram_reballing',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_zero_reaction_pwrkey',
        title: 'Diagnóstico de 0.000A Absoluto al Pulsar Power: Línea PWR_KEY y Alimentación de PMIC',
        category: 'measurement',
        description: 'El amperímetro permanece en 0.000A sin el más mínimo pulso al presionar el botón. Medir el voltaje presente en el pin del botón de encendido (PWR_KEY / PON_1) en la placa y verificar que la línea VPH_PWR / VDD_MAIN tenga los 4.2V provenientes del IF PMIC.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.80V a 4.00V en pad PWR_KEY | 4.20V en bobina VPH_PWR',
            tolerance: 'Al pulsar el botón, PWR_KEY debe caer a 0.00V',
            referenceValues: {
              diodeDrop: 'PWR_KEY: 0.450V - 0.620V (Si mide OL, pista o resistencia en serie abierta)',
              nominalVoltage: 'VPH_PWR = 4.2V | PWR_KEY = 1.8V / 3.8V',
              usbCurrent: '0.000A'
            }
          }
        ],
        technicalTips: 'Si en el conector de batería hay 4.2V pero en la bobina de VPH_PWR hay 0.00V, el IF PMIC está abierto y el PMIC principal nunca recibe tensión de trabajo.',
        options: [
          {
            label: 'Hay voltaje en el pad PWR_KEY y la placa enciende al puentear el pad con pinzas (Flex dañado)',
            targetNodeId: 'cne_verdict_power_flex_open',
            badgeColor: 'green'
          },
          {
            label: '0.00V en línea VPH_PWR / VDD_MAIN (El IF PMIC no transfiere el voltaje de VBAT al sistema)',
            targetNodeId: 'cne_verdict_if_pmic_short',
            badgeColor: 'yellow'
          },
          {
            label: 'VPH_PWR tiene 4.2V pero el pad PWR_KEY tiene 0.00V (PMIC Principal dañado o línea abierta)',
            targetNodeId: 'cne_verdict_pmic_sequence_fault',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'cne_verdict_vbat_tvs_cap',
        title: 'Veredicto: Diodo TVS o Capacitor de Entrada en Línea VBAT en Cortocircuito',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El cortocircuito directo previo a presionar Power se localizó en el diodo supresor de transitorios (TVS) o en un capacitor cerámico MLCC en paralelo al conector de batería VBAT.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V - 0.520V restablecidos en VBAT tras extraer el componente',
            tolerance: 'Consumo inicial en fuente vuelve a 0.000A'
          }
        ],
        technicalTips: 'Procedimiento: Extraer el diodo TVS o capacitor perforado con cautín o aire a 340°C. Limpiar pads y colocar componente de reemplazo para conservar el filtrado y protección ESD.',
        options: []
      },
      {
        id: 'cne_verdict_if_pmic_short',
        title: 'Veredicto: Circuito Integrado IF PMIC / Controlador de Carga Dañado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado secundario de gestión de carga e interfaz (IF PMIC / Sub-PMIC / Tristar) presenta daño interno en su etapa conmutadora entre VBAT y VPH_PWR o fuga pasiva a tierra.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: '0.000A en reposo y transferencia normal de 4.2V hacia VPH_PWR',
            tolerance: 'Normalización completa tras cambio de IC'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el IF PMIC (ej. SM5714, BQ25890, MT6371, PMI632) a 360°C protegiendo con disipador los circuitos integrados con resina adyacentes. Limpiar pads, verificar caída de tensión y soldar IC nuevo.',
        options: []
      },
      {
        id: 'cne_verdict_vph_mlcc_short',
        title: 'Veredicto: Capacitor Cerámico MLCC en Cortocircuito en Línea Principal VPH_PWR / VDD_MAIN',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Un condensador de desacoplo de la línea principal VPH_PWR / VDD_MAIN sufrió fractura dieléctrica, bloqueando el encendido con corto directo en la fuente de laboratorio.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.360V - 0.440V restaurados en VPH_PWR',
            tolerance: 'Consumo en reposo 0.000A'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el capacitor MLCC detectado mediante rosin/cámara térmica y reemplazarlo por uno de igual capacidad y tensión mínima de 10V-16V.',
        options: []
      },
      {
        id: 'cne_verdict_rf_pa_short',
        title: 'Veredicto: Amplificador de Potencia de Radiofrecuencia (PA RF) en Corto',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El módulo amplificador de potencia de radiofrecuencia (2G/3G/4G/5G), alimentado directamente por la línea principal VPH_PWR, se puso en cortocircuito interno.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Desaparición inmediata del corto en VPH_PWR al retirar el PA RF',
            tolerance: 'El equipo vuelve a encender normalmente tras retirar el PA'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el PA en corto a 350°C, comprobar que el teléfono encienda perfectamente e instalar un nuevo PA de la misma nomenclatura para restablecer la señal de red móvil.',
        options: []
      },
      {
        id: 'cne_verdict_pmic_or_subic_short',
        title: 'Veredicto: Corto Interno en PMIC Principal o Driver Secundario en VPH_PWR',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado PMIC principal (o driver de Backlight/Audio conectado al riel VPH_PWR) presenta perforación interna a masa.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Recuperación de impedancia nominal (> 0.350V) al levantar el IC afectado',
            tolerance: 'Sin continuidad a GND en los pads de entrada'
          }
        ],
        technicalTips: 'Procedimiento: Extraer el IC involucrado, verificar en frío que las salidas hacia el CPU no estén en corto y montar un integrado nuevo con estaño 183°C.',
        options: []
      },
      {
        id: 'cne_verdict_leakage_cap_corrosion',
        title: 'Veredicto: Fuga Pasiva por Sulfatación o Capacitor con Pérdida de Aislamiento',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La fuga inicial de bajo consumo antes de presionar Power proviene de corrosión electrolítica entre pines de un conector FPC o de un capacitor con resistencia parásita.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Consumo inicial retorna a 0.000A estricto',
            tolerance: '0 mA en reposo'
          }
        ],
        technicalTips: 'Procedimiento: Realizar limpieza ultrasónica o cepillado bajo microscopio con alcohol isopropílico al 99% y flux, resoldando los pines oxidados y cambiando los capacitores oscurecidos.',
        options: []
      },
      {
        id: 'cne_verdict_i2c_bus_fault',
        title: 'Veredicto: Bloqueo de Arranque por Falla en Protocolo de Bus I2C (SDA / SCL)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El consumo fijo tras pulsar Power era provocado por el colapso de una línea de comunicación I2C (SDA o SCL), impidiendo que el procesador se comunique con el PMIC o periféricos críticos.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.80V restablecidos en ambas líneas SDA y SCL',
            tolerance: 'Caída en modo diodo simétrica (~0.500V)'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar la resistencia pull-up doble de 2.2kΩ (conectada a 1.8V) o aislar el periférico/sensor que arrastraba la línea I2C a tierra.',
        options: []
      },
      {
        id: 'cne_verdict_xtal_oscillator_fault',
        title: 'Veredicto: Falla de Oscilación en Cristal Maestro XTAL (38.4MHz / 26MHz)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El cristal oscilador de referencia del PMIC/CPU no genera la frecuencia de reloj, dejando al procesador y al PMIC congelados en un consumo fijo bajo tras presionar Power.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Onda senoidal estable en la frecuencia nominal del cristal',
            tolerance: 'Arranque inmediato tras sustitución'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el cristal oscilador SMD (y su termistor integrado si es un TCXO de 4 pines) cuidando de no sobrecalentarlo a más de 320°C durante el montaje.',
        options: []
      },
      {
        id: 'cne_verdict_pmic_sequence_fault',
        title: 'Veredicto: Falla en PMIC Principal (Secuencia de Encendido / Power Hold)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El PMIC principal no completa la secuencia de activación de sus reguladores BUCK/LDO o no retiene el enclavamiento de encendido pese a no tener cortos externos.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Activación completa de rieles BUCK (0.8V - 1.2V) y LDO (1.8V / 3.0V)',
            tolerance: 'Secuencia de boot completa'
          }
        ],
        technicalTips: 'Procedimiento: Realizar reballing o sustitución directa del PMIC principal, verificando previamente la integridad de las bobinas de conmutación circundantes.',
        options: []
      },
      {
        id: 'cne_verdict_secondary_rail_short',
        title: 'Veredicto: Cortocircuito en Línea Secundaria BUCK / LDO del PMIC (Caída a Cero)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La caída instantánea a 0.000A al soltar Power es causada por el disparo de protección del PMIC ante un cortocircuito en una línea secundaria (ej. VIO 1.8V, VREG_S4 o LDO de sensores).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Recuperación de caída nominal (> 0.250V) en la bobina o salida LDO',
            tolerance: 'Sin continuidad a tierra'
          }
        ],
        technicalTips: 'Procedimiento: Inyectar en la línea secundaria afectada una tensión que NUNCA supere el voltaje nominal de ese riel (ej. máx 1.2V o 1.8V) y localizar el capacitor o IC en corto con cámara térmica.',
        options: []
      },
      {
        id: 'cne_verdict_nand_ufs_fault',
        title: 'Veredicto: Falla de Memoria UFS / eMMC o Corrupción de Bootloader (Modo 9008 / VCOM)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El consumo fijo de ~120mA-200mA y la detección directa en PC como puerto de emergencia confirman que el CPU no logra cargar las particiones de inicio desde la memoria flash.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: 'Flasheo exitoso o lectura saludable de bloques en programadora UFS/eMMC',
            tolerance: 'Vida útil de memoria (Health Status) dentro de rango'
          }
        ],
        technicalTips: 'Procedimiento: Intentar reparación de software/bootloader por puerto de emergencia. Si arroja error de lectura/escritura, desmontar la memoria UFS/eMMC para reprogramación en zócalo o reemplazo.',
        options: []
      },
      {
        id: 'cne_verdict_cpu_ram_reballing',
        title: 'Veredicto: Soldadura Fría / Fisura BGA en conjunto CPU + Memoria RAM',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El consumo fijo o caída a cero tras un impacto mecánico responde a la pérdida de contacto en las esferas BGA debajo del procesador (SoC) o la memoria RAM PoP/LPDDR.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Secuencia dinámica de arranque restaurada tras Reballing de precisión',
            tolerance: 'Consumo oscilante normal hasta encender pantalla'
          }
        ],
        technicalTips: 'Procedimiento: Extracción de blindaje, limpieza de resina epóxica (underfill) a 210°C, levantamiento de CPU/RAM a 340°C-360°C y reballing con stencil específico y pasta de estaño 183°C.',
        options: []
      },
      {
        id: 'cne_verdict_power_flex_open',
        title: 'Veredicto: Flex de Botón de Encendido Roto o Pista PWR_KEY Abierta',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La placa lógica está sana y enciende al puentear el testpoint PWR_KEY, pero el pulsador físico o su pista serie hasta el conector está abierta.',
        measurements: [
          {
            tool: 'Multímetro (Continuidad / Ohmios)',
            expected: '0.0Ω al presionar el botón mecánico de encendido',
            tolerance: 'Cierre franco a GND'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el flexor del botón Power o reconstruir la pista/resistencia serie de 1kΩ en la línea PWR_KEY.',
        options: []
      }
    ]
  },
  {
    id: 'falla_carga_usbc_pin',
    name: 'Falla de Carga USB-C / Pin de Carga',
    deviceType: 'Smartphone / Tablet (Sub-placa y Placa Principal USB-C)',
    description: 'Diagnóstico técnico de sistema de carga USB-C: diferenciación entre tester USB sin consumo (0.00A / corto en VBUS / OVP / CC1-CC2), consumo lento fijo (~0.4A por líneas de datos D+/D- abiertas o falla en IF PMIC) y reinicio en logo o alerta de temperatura (termistor NTC / BATT_ID).',
    nodes: [
      {
        id: 'usb_start',
        title: 'Conexión de Tester USB-C: Evaluación de Tensión y Corriente de Entrada',
        category: 'symptom',
        description: 'Conectar el equipo al cargador mediante un Tester / Amperímetro USB-C (girando el conector en ambos sentidos: Cara A y Cara B). Observar el voltaje en línea VBUS (5.0V / 9.0V) y el consumo de corriente en Amperios.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: '5.0V / 1.50A - 2.20A (Carga Normal) o 9.0V / 1.80A+ (Carga Rápida PD/QC)',
            tolerance: '0.00A o ~0.40A fijos indican anomalía en la etapa de carga',
            referenceValues: {
              diodeDrop: 'VBUS: 0.450V - 0.580V | D+/D-: 0.580V - 0.700V | CC1/CC2: 0.480V - 0.560V',
              nominalVoltage: '5.0V (Estándar) / 9.0V - 12.0V (Fast Charge)',
              usbCurrent: '1.50A - 2.40A nominal'
            }
          }
        ],
        technicalTips: 'Probar siempre invirtiendo el cable USB-C a 180°. Si carga de un solo lado, una de las líneas de configuración de canal (CC1 o CC2) está desoldada en el pin de carga.',
        options: [
          {
            label: 'Tester USB sin consumo (0.00A absoluto) o el Tester se apaga al conectarlo',
            targetNodeId: 'usb_no_current_check',
            badgeColor: 'red'
          },
          {
            label: 'Consumo lento fijo (~0.40A - 0.50A, no activa Carga Rápida ni reconoce PC) o Carga Falsa',
            targetNodeId: 'usb_slow_charge_dp_dm',
            badgeColor: 'yellow'
          },
          {
            label: 'Reinicio en Logo al conectar cargador, consumo pulsante (0A <-> 0.2A) o Triángulo de Temperatura',
            targetNodeId: 'usb_bootloop_thermistor_check',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'usb_no_current_check',
        title: 'Tester USB en 0.00A: Medición de VBUS (5V), Corto de Entrada y Pines CC1 / CC2',
        category: 'measurement',
        description: 'Desarmar y medir con multímetro en el testpoint VBUS de la sub-placa de carga y en el conector FPC que sube a la placa principal. Verificar si los 5.0V llegan desde el pin de carga o si caen a 0V por cortocircuito.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '5.00V DC presentes en pin VBUS de sub-placa y en entrada de placa principal',
            tolerance: '4.85V - 5.25V',
            referenceValues: {
              diodeDrop: 'VBUS: 0.450V - 0.580V | CC1/CC2: 0.480V - 0.560V',
              nominalVoltage: '5.0V en VBUS | 0.4V - 1.6V en CC1/CC2 activa',
              usbCurrent: '0.00A'
            }
          },
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V - 0.580V en VBUS y 5.1 kΩ a tierra en resistencias Rd de CC1/CC2',
            tolerance: '0.000V en VBUS indica diodo TVS u OVP en corto a tierra'
          }
        ],
        technicalTips: 'En cargadores USB-C a USB-C (Power Delivery), la fuente NO entrega 5V a menos que detecte las resistencias pull-down Rd de 5.1 kΩ en los pines CC1 / CC2 del teléfono.',
        options: [
          {
            label: 'El Tester USB se apaga y VBUS mide 0.000V en modo diodo (Corto directo en entrada 5V)',
            targetNodeId: 'usb_verdict_vbus_tvs_short',
            badgeColor: 'red'
          },
          {
            label: 'No hay 5.0V en la sub-placa o fallan pines CC1/CC2 (Pin de carga USB-C roto, sulfatado o desoldado)',
            targetNodeId: 'usb_verdict_port_pin_replace',
            badgeColor: 'green'
          },
          {
            label: 'Los 5.0V están en la sub-placa pero NO llegan a la placa madre (Flex principal o conector FPC abierto)',
            targetNodeId: 'usb_verdict_subboard_flex',
            badgeColor: 'yellow'
          },
          {
            label: 'Los 5.0V sí llegan a la placa madre pero el equipo sigue en 0.00A (Revisión de OVP IC)',
            targetNodeId: 'usb_ovp_ic_check',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'usb_ovp_ic_check',
        title: 'Verificación del Circuito Integrado Protector de Sobretensión (OVP IC)',
        category: 'measurement',
        description: 'En la placa principal, la línea VBUS_5V atraviesa primero un chip OVP (Over Voltage Protection, BGA pequeño de 9 o 12 bolas) antes de entrar al IF PMIC. Medir voltaje en el capacitor de entrada del OVP y en el capacitor de salida del OVP.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Entrada OVP: 5.0V | Salida OVP (VBUS_OVP_OUT): 5.0V',
            tolerance: 'Si entran 5.0V y salen 0.0V, el OVP está abierto o su salida está en corto',
            referenceValues: {
              diodeDrop: 'Entrada OVP: ~500mV | Salida OVP hacia IF PMIC: ~480mV',
              nominalVoltage: '5.0V en entrada y salida',
              usbCurrent: '0.00A'
            }
          }
        ],
        technicalTips: 'Antes de puentear o reemplazar un OVP que tiene 0V en su salida, medir siempre en modo diodo el pad de salida: si mide 0.000V a tierra, el corto está dentro del IF PMIC y el OVP simplemente se protegió.',
        options: [
          {
            label: 'Entran 5.0V al OVP, salen 0.0V y la salida NO tiene corto a tierra (OVP IC quemado/abierto)',
            targetNodeId: 'usb_verdict_ovp_damaged',
            badgeColor: 'green'
          },
          {
            label: 'Entran y salen 5.0V del OVP hacia el IF PMIC, o la salida está en corto (IF PMIC dañado)',
            targetNodeId: 'usb_verdict_if_pmic_charger',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'usb_slow_charge_dp_dm',
        title: 'Consumo Lento (0.40A): Medición de Líneas de Datos USB D+ y D- en Modo Diodo',
        category: 'measurement',
        description: 'Un consumo clavado en ~0.40A a 0.48A indica que el IF PMIC detecta los 5V de VBUS pero NO logra realizar el protocolo de identificación de cargador (BC1.2 / QC / AFC) a través de los pines de datos D+ (DP) y D- (DM), limitando la corriente por seguridad. Medir caída de tensión en D+ y D-.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'D+ (DP): 0.580V - 0.720V | D- (DM): 0.580V - 0.720V (Valores gemelos)',
            tolerance: 'Diferencia máxima de ±0.015V entre D+ y D- (OL = abierto | < 0.250V = fuga)',
            referenceValues: {
              diodeDrop: 'D+ y D- deben medir idénticos (ej. 0.640V y 0.642V)',
              nominalVoltage: '0.6V - 3.3V durante negociación de carga rápida',
              usbCurrent: '0.40A - 0.49A fijos en tester USB'
            }
          }
        ],
        technicalTips: 'Conectar el teléfono encendido a la PC: si la PC no hace ningún ruido ni lo detecta como dispositivo MTP/ADB, confirma al 100% que las líneas D+ / D- están interrumpidas o en fuga.',
        options: [
          {
            label: 'Línea D+ o D- marca OL (Circuito abierto): Pin desoldado en puerto USB-C, filtro EMI o flex roto',
            targetNodeId: 'usb_verdict_dp_dm_open',
            badgeColor: 'green'
          },
          {
            label: 'Línea D+ o D- en corto o baja impedancia (< 0.250V) o desbalanceada: Diodo ESD o IF PMIC en fuga',
            targetNodeId: 'usb_dp_dm_leak_isolation',
            badgeColor: 'yellow'
          },
          {
            label: 'D+ y D- miden simétricos (600mV) y PC reconoce datos, pero sigue en 0.4A o "Carga Falsa"',
            targetNodeId: 'usb_if_pmic_coil_boot_check',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'usb_dp_dm_leak_isolation',
        title: 'Aislamiento de Corto / Fuga en D+ y D-: Diodos TVS/ESD vs IF PMIC',
        category: 'inspection',
        description: 'Desconectar el flex de la sub-placa de carga y volver a medir D+ y D- directamente en el conector FPC de la placa principal para determinar si la fuga está en la sub-placa inferior o en la placa madre (diodos ESD o IF PMIC).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Recuperación de ~0.640V al retirar el diodo ESD de protección de datos',
            tolerance: 'Si persiste el valor bajo sin diodos ESD, la fuga es interna del IF PMIC o CPU',
            referenceValues: {
              diodeDrop: '0.600V - 0.700V nominal sin fuga',
              nominalVoltage: '0.00V en frío',
              usbCurrent: '0.40A en carga lenta'
            }
          }
        ],
        technicalTips: 'Las sobretensiones por cables dañados suelen poner en fuga los pequeños diodos TVS dobles ubicados junto al conector FPC antes de dañar el IF PMIC.',
        options: [
          {
            label: 'El valor bajo desaparece al desconectar la sub-placa o al retirar los diodos ESD de datos',
            targetNodeId: 'usb_verdict_esd_data_short',
            badgeColor: 'green'
          },
          {
            label: 'El corto/desbalance en D+ o D- proviene directamente del interior del IF PMIC',
            targetNodeId: 'usb_verdict_if_pmic_charger',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'usb_if_pmic_coil_boot_check',
        title: 'Diagnóstico de Carga Falsa / 0.4A: Bobina VPH_PWR (LX_CHG) y Capacitor BOOT del IF PMIC',
        category: 'measurement',
        description: 'Cuando el equipo muestra el icono de rayo de carga pero consume 0.15A - 0.40A y el porcentaje de batería no sube (Carga Falsa), el convertidor Buck de carga dentro del IF PMIC no está conmutando. Revisar la bobina de carga (LX_CHG / VPH_PWR) y el capacitor de Bootstrap (C_BOOT, típicamente 22nF - 47nF conectado entre el pin BOOT y la bobina LX).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VPH_PWR: 3.8V - 4.2V | Capacitor BOOT: ~8.0V de un lado y ~4.0V del lado de la bobina',
            tolerance: 'Si ambos lados de C_BOOT miden 4.0V o falta C_BOOT, el MOSFET interno no conmuta',
            referenceValues: {
              diodeDrop: 'Bobina LX: 0.360V - 0.450V | Pin BOOT: 0.450V - 0.580V',
              nominalVoltage: 'Pin BOOT eleva a ~8V con cargador conectado',
              usbCurrent: '0.15A - 0.42A (Sin inyección real hacia VBAT)'
            }
          }
        ],
        technicalTips: 'Un golpe o limpieza agresiva suele volar el pequeño capacitor C_BOOT junto al IF PMIC, causando que el teléfono marque "Cargando" en pantalla pero jamás eleve la corriente por encima de 0.40A.',
        options: [
          {
            label: 'Capacitor C_BOOT desprendido, en fuga o bobina de conmutación LX_CHG fisurada',
            targetNodeId: 'usb_verdict_boot_cap_coil',
            badgeColor: 'green'
          },
          {
            label: 'Bobina y C_BOOT están sanos pero el IF PMIC no regula corriente hacia VBAT',
            targetNodeId: 'usb_verdict_if_pmic_charger',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'usb_bootloop_thermistor_check',
        title: 'Reinicio en Logo / Pausa de Carga: Líneas BATT_THERM (NTC), BATT_ID y Batería',
        category: 'measurement',
        description: 'Si el equipo al conectar el cargador muestra el logo, se reinicia en bucle o despliega alerta de "Temperatura de batería muy baja/alta", medir en el conector FPC de batería la tensión de división del termistor (BATT_THERM / BAT_THM) y la línea de identificación (BATT_ID / Fuel Gauge I2C).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'BATT_THERM: 0.60V a 1.20V a temperatura ambiente (25°C) desde pull-up de 1.8V',
            tolerance: 'Si mide 1.80V clavados (NTC abierto) o 0.00V (sin pull-up/corto), dispara alerta y reinicio',
            referenceValues: {
              diodeDrop: 'BATT_THERM / BATT_ID: 0.480V - 0.650V',
              nominalVoltage: 'VRTC / VIO pull-up = 1.80V -> divisor NTC = ~0.90V',
              usbCurrent: 'Ciclo 0.00A <-> 0.25A <-> 0.00A'
            }
          }
        ],
        technicalTips: 'Muchos equipos (especialmente Samsung, Xiaomi y Motorola) incorporan un termistor NTC de 10kΩ o 100kΩ en la sub-placa de carga o en el flex de la batería. Si se reemplaza la sub-placa por una genérica sin termistor, el equipo acusará falla térmica o se reiniciará.',
        options: [
          {
            label: 'Línea BATT_THERM (NTC) sin los ~0.9V nominales (Termistor dañado, resistencia pull-up abierta o sub-placa genérica)',
            targetNodeId: 'usb_verdict_thermistor_ntc',
            badgeColor: 'green'
          },
          {
            label: 'Batería degradada, desconectada o con BMS bloqueado (El cargador no ve carga en VBAT y reinicia)',
            targetNodeId: 'usb_verdict_battery_bms_fault',
            badgeColor: 'yellow'
          },
          {
            label: 'Falla en integrado medidor de carga (Fuel Gauge IC / Bus I2C de batería)',
            targetNodeId: 'usb_verdict_fuel_gauge_ic',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'usb_verdict_vbus_tvs_short',
        title: 'Veredicto: Diodo Supresor TVS de Línea VBUS (5V) en Cortocircuito',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El diodo de protección de sobretensión ubicado a la entrada de la línea VBUS de 5V se encuentra en cortocircuito pleno a masa, apagando el tester USB al conectarlo.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.480V - 0.560V restaurados en VBUS tras retirar el diodo TVS',
            tolerance: 'El tester USB enciende con 5.0V/9.0V normalmente'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el diodo TVS perforado en la sub-placa o cerca del conector FPC y colocar un TVS de reemplazo apto para 20V (compatible con carga rápida PD).',
        options: []
      },
      {
        id: 'usb_verdict_port_pin_replace',
        title: 'Veredicto: Reemplazo de Pin de Carga USB-C (Pines VBUS / CC1 / CC2 Dañados)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El conector hembra USB-C presenta desgaste mecánico, sulfatación interna o soldaduras quebradas en los pines de alimentación VBUS o de detección CC1/CC2.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: 'Carga activa en ambos sentidos del cable USB-C (Cara A y Cara B)',
            tolerance: '1.50A - 2.20A estables'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el pin USB-C con aire caliente desde la cara inferior o aleación de baja fusión (138°C). Estañar los 16/24 pads con soldadura 63/37, montar conector nuevo reforzado y verificar cada pin bajo el microscopio.',
        options: []
      },
      {
        id: 'usb_verdict_subboard_flex',
        title: 'Veredicto: Falla en Flex Intermedio (Main Flex) o Conector FPC de Sub-placa',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Los 5.0V ingresan por el pin USB-C pero se pierden en el trayecto hacia la placa madre debido a fractura en el cable flex intermedio o soldadura fría en el conector FPC.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '5.00V continuos en el testpoint VBUS de la placa principal',
            tolerance: 'Sin caída de tensión entre sub-placa y motherboard'
          }
        ],
        technicalTips: 'Procedimiento: Resoldar con cautín de punta micro-biselada los extremos de potencia del conector FPC o sustituir el flex principal de interconexión.',
        options: []
      },
      {
        id: 'usb_verdict_ovp_damaged',
        title: 'Veredicto: Circuito Integrado OVP (Over Voltage Protection) Abierto / Dañado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El chip protector de sobretensión OVP recibe los 5.0V de VBUS pero se abrió internamente, impidiendo el paso de tensión hacia el IF PMIC.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '5.0V presentes en la salida del OVP hacia el IF PMIC',
            tolerance: 'Activación inmediata de consumo en Tester USB'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el chip OVP BGA por uno equivalente de placa donante (solo realizar jumper entre entrada y salida para prueba diagnóstica en banco, nunca dejar sin protección definitiva).',
        options: []
      },
      {
        id: 'usb_verdict_dp_dm_open',
        title: 'Veredicto: Líneas de Datos USB (D+ / D-) Abiertas (Causa de Carga Lenta a 0.4A)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La limitación a 0.40A y la falta de Carga Rápida/conexión a PC se deben a que una o ambas pistas de datos (D+ / D-) están en circuito abierto (OL) en el pin de carga, filtro EMI o conector FPC.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.620V simétricos en ambos pines D+ y D- desde un tester USB breakout',
            tolerance: 'Activación de protocolo 9.0V Fast Charge y reconocimiento en PC'
          }
        ],
        technicalTips: 'Procedimiento: Resoldar los pines centrales de datos del puerto USB-C bajo microscopio, puentear el filtro choke EMI doble si está abierto o reconstruir la pista hacia el conector FPC.',
        options: []
      },
      {
        id: 'usb_verdict_esd_data_short',
        title: 'Veredicto: Diodo ESD de Líneas de Datos D+ / D- en Fuga',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Uno de los diodos supresores ESD en paralelo con las líneas D+ o D- presenta fuga a tierra, alterando la tensión diferencial de negociación de carga rápida.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Valores equilibrados (~0.640V) en D+ y D- tras extraer el diodo ESD',
            tolerance: 'Corriente de carga sube inmediatamente a > 1.5A'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el diodo TVS/ESD en fuga con aire caliente y reemplazarlo por un supresor de baja capacitancia para líneas USB 2.0.',
        options: []
      },
      {
        id: 'usb_verdict_boot_cap_coil',
        title: 'Veredicto: Capacitor de Bootstrap (C_BOOT) o Bobina LX de Carga Dañada (Carga Falsa)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El síntoma de carga falsa / consumo lento con datos sanos se originó en el capacitor de excitación C_BOOT o la bobina reductora LX_CHG del IF PMIC.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: 'Incremento inmediato del consumo real a 1.60A - 2.20A y subida del % de batería',
            tolerance: 'Conmutación PWM restablecida en la bobina de carga'
          }
        ],
        technicalTips: 'Procedimiento: Instalar un capacitor cerámico de 22nF a 47nF (25V) en la posición C_BOOT y asegurar la perfecta soldadura de la bobina de potencia VPH_PWR.',
        options: []
      },
      {
        id: 'usb_verdict_if_pmic_charger',
        title: 'Veredicto: Reemplazo de Circuito Integrado de Carga (IF PMIC / Charger IC)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado de carga (IF PMIC) tiene averiada su etapa interna de conmutación Buck o su bloque transceptor USB (D+/D-), impidiendo la carga normal.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: 'Negociación de 5V/9V y corriente > 1.5A con carga real hacia la batería',
            tolerance: 'Temperatura del IC < 42°C durante la carga'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el IF PMIC, limpiar los pads con malla desoldadora, verificar en frío que no existan pistas abiertas e instalar un IC nuevo realizando reballing con estaño 183°C.',
        options: []
      },
      {
        id: 'usb_verdict_thermistor_ntc',
        title: 'Veredicto: Falla en Circuito de Termistor NTC (BATT_THERM) / Divisor Térmico',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El reinicio en logo o bloqueo de carga por temperatura se debe a la ausencia o desvalorización del termistor NTC o de su resistencia pull-up de 1.8V.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '0.85V - 1.05V estables en la línea BATT_THERM a 25°C',
            tolerance: 'Carga continua sin alertas de temperatura'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el termistor NTC de 10kΩ/100kΩ (o trasplantar el termistor original si se colocó una sub-placa alternativa) y verificar la continuidad de la pista THM hasta el PMIC.',
        options: []
      },
      {
        id: 'usb_verdict_battery_bms_fault',
        title: 'Veredicto: Batería con BMS Protegido o Celda Degradada (Reinicio en Logo)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito de carga funciona pero la batería tiene su placa BMS abierta o resistencia interna excesiva, causando caída brusca de tensión al intentar iniciar el sistema.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.85V - 4.20V sostenidos bajo carga con batería nueva',
            tolerance: 'Sin caídas de tensión durante el arranque'
          }
        ],
        technicalTips: 'Procedimiento: Reactivar la batería en fuente de banco por encima de 3.7V o sustituir por una batería nueva verificando el estado del conector FPC.',
        options: []
      },
      {
        id: 'usb_verdict_fuel_gauge_ic',
        title: 'Veredicto: Circuito Integrado Medidor de Batería (Fuel Gauge IC) Dañado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El chip Fuel Gauge no reporta el porcentaje ni la presencia de batería al procesador a través del bus I2C, provocando reinicios o lectura fija en 0% / 50%.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.500V en líneas FG_SDA y FG_SCL',
            tolerance: 'Lectura real del porcentaje de batería restaurada'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el IC Fuel Gauge (ej. MAX77705 / CW2015 / BQ27426) o resoldar sus resistencias de sensado de corriente (Shunt de 0.01Ω).',
        options: []
      }
    ]
  },
  {
    id: 'pc_consola_sin_video',
    name: 'PC / Consola Enciende sin Dar Video',
    deviceType: 'PC Desktop / Laptop / Consola (PS4, PS5, Xbox Series)',
    description: 'Protocolo estructurado para equipos que encienden (giran coolers o prende LED) pero no dan video o se apagan: descarte de fuente de alimentación, memoria RAM, cortocircuitos en líneas secundarias de 12V/5V/3.3V, etapa HDMI/GPU y corte por sobrecalentamiento.',
    nodes: [
      {
        id: 'pcv_start',
        title: 'Evaluación del Comportamiento de Encendido (Permanencia vs Apagado / Reinicio)',
        category: 'symptom',
        description: 'Al presionar el botón de encendido del equipo (PC o Consola), observar el comportamiento de los ventiladores (coolers), indicadores LED de estado (EZ-Debug / Luz Azul-Blanca en consola) y si la fuente mantiene el equipo encendido o se apaga.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Rieles principales presentes: +12.0V, +5.0V y +3.3V',
            tolerance: 'Variación máxima permitida de ±5% (Estándar ATX / PSU)',
            referenceValues: {
              diodeDrop: '12V: 0.380V - 0.520V | 5V: 0.350V - 0.480V | 3.3V: 0.280V - 0.420V',
              nominalVoltage: '+12.0V / +5.0V / +3.3V / +5VSB',
              usbCurrent: '5.0V presentes en puertos USB si hay 5VSB/5V activo'
            }
          }
        ],
        technicalTips: 'Distinguir de inmediato tres escenarios: 1) Se apaga en 1-2 segundos (Protección por corto o fuente dañada), 2) Queda encendido fijo sin dar video (Falla de POST: RAM, BIOS, VRM o etapa HDMI/GPU), 3) Acelera coolers al máximo y se apaga (Sobrecalentamiento).',
        options: [
          {
            label: 'Amaga encender (gira el cooler 1 seg y se apaga) o la fuente entra en protección inmediata',
            targetNodeId: 'pcv_psu_and_rails_short_check',
            badgeColor: 'red'
          },
          {
            label: 'Queda encendido de forma continua pero la pantalla permanece en negro ("Sin Señal")',
            targetNodeId: 'pcv_post_verification',
            badgeColor: 'yellow'
          },
          {
            label: 'Enciende pero acelera los ventiladores al 100% y se apaga al poco tiempo (Sobrecalentamiento)',
            targetNodeId: 'pcv_overheating_thermal_check',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'pcv_psu_and_rails_short_check',
        title: 'Descarte de Fuente de Alimentación vs Corto en Líneas Secundarias de 12V, 5V y 3.3V',
        category: 'measurement',
        description: 'Desconectar el equipo de la red eléctrica. Medir en Modo Diodo / Continuidad respecto a chasis (GND) en las líneas principales de +12V (conector ATX 24 pines, EPS 8 pines de CPU y entrada de 12V en consola), +5V y +3.3V.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '+12V: > 0.350V | +5V: > 0.300V | +3.3V: > 0.250V',
            tolerance: '0.000V - 0.010V (< 2Ω) confirma cortocircuito en placa que protege la fuente',
            referenceValues: {
              diodeDrop: '12V ~450mV | 5V ~380mV | 3.3V ~320mV',
              nominalVoltage: 'Fuente aislada debe entregar 12.0V, 5.0V, 3.3V y señal PG = 5.0V',
              usbCurrent: '0.00A en puertos USB si 5V está en corto'
            }
          }
        ],
        technicalTips: 'Prueba rápida en PC: Desconectar el conector de 8 pines (12V EPS del CPU) y el de la placa de video. Si al desconectar el conector de 8 pines la placa deja de apagarse y el cooler gira continuo, el corto está en un MOSFET/DrMOS del VRM de 12V del procesador.',
        options: [
          {
            label: 'Cortocircuito en línea de +12V (0.000V en conector EPS 8 pines, PCIe o riel principal de consola)',
            targetNodeId: 'pcv_12v_vrm_short_isolation',
            badgeColor: 'red'
          },
          {
            label: 'Cortocircuito en línea secundaria de +5V o +3.3V (Puertos USB, LDO, Audio, Red LAN o Southbridge)',
            targetNodeId: 'pcv_5v_3v3_short_isolation',
            badgeColor: 'red'
          },
          {
            label: 'No hay cortos en placa: La Fuente de Alimentación cae de tensión bajo carga o no emite Power Good',
            targetNodeId: 'pcv_verdict_psu_fault',
            badgeColor: 'green'
          }
        ]
      },
      {
        id: 'pcv_12v_vrm_short_isolation',
        title: 'Localización de Corto en Línea de 12V: Fase VRM (MOSFET / DrMOS) vs Capacitor MLCC',
        category: 'inspection',
        description: 'Inyectar con fuente de laboratorio 1.5V a 2.5V (corriente limitada a 3.0A) en el riel de 12V afectado y observar con cámara térmica o alcohol isopropílico la zona de reguladores VRM de CPU/GPU/APU y capacitores cerámicos de desacoplo.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Identificación exacta del MOSFET High-Side, DrMOS o capacitor cerámico que se calienta',
            tolerance: 'NUNCA inyectar 12V directos si un MOSFET High-Side está en corto hacia el núcleo',
            referenceValues: {
              diodeDrop: 'Drain-Source de MOSFET sano: 0.420V - 0.550V',
              nominalVoltage: 'Inyección segura: 1.5V DC',
              usbCurrent: '2.5A - 3.0A en fuente de banco'
            }
          }
        ],
        technicalTips: 'Si un MOSFET High-Side se pone en corto entre Drain (12V) y Source (Fase de CPU/GPU), al inyectar más de 1.5V esa tensión pasará directo al procesador. Inyectar siempre 1.2V - 1.5V como máximo.',
        options: [
          {
            label: 'Se calienta un MOSFET High-Side o integrado DrMOS de una fase de alimentación VRM',
            targetNodeId: 'pcv_verdict_12v_vrm_mosfet',
            badgeColor: 'yellow'
          },
          {
            label: 'Se calienta un capacitor cerámico SMD (MLCC) de filtrado en la línea de 12V',
            targetNodeId: 'pcv_verdict_12v_cap_short',
            badgeColor: 'green'
          }
        ]
      },
      {
        id: 'pcv_5v_3v3_short_isolation',
        title: 'Localización de Corto en Líneas Secundarias de 5V y 3.3V',
        category: 'inspection',
        description: 'Inyectar hasta 3.3V (en riel de 3.3V) o hasta 4.5V (en riel de 5V) con límite de 2.0A y rastrear térmicamente los periféricos integrados: chip de red Ethernet LAN (Realtek/Intel), códec de audio, controladores USB, chip Super I/O o PCH/Southbridge.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Elevación térmica localizada en el integrado o capacitor en corto',
            tolerance: 'Respetar estrictamente el voltaje máximo de 3.3V en líneas lógicas',
            referenceValues: {
              diodeDrop: '5V: ~0.380V | 3.3V: ~0.320V tras eliminar el corto',
              nominalVoltage: '3.30V / 5.00V',
              usbCurrent: 'Disparo de protección OCP en puertos USB si 5V cae'
            }
          }
        ],
        technicalTips: 'Un golpe en un puerto USB con los pines doblados a chasis o una descarga por cable de red RJ45 son las causas más frecuentes de corto en los rieles de 5V y 3.3V.',
        options: [
          {
            label: 'Calienta un chip periférico (Red LAN, Audio, Regulador LDO, Puerto USB o capacitor de 5V/3.3V)',
            targetNodeId: 'pcv_verdict_5v_3v3_peripheral',
            badgeColor: 'green'
          },
          {
            label: 'Calienta directamente el Chipset PCH / Southbridge (Corto interno en silicio)',
            targetNodeId: 'pcv_verdict_pch_southbridge_dead',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'pcv_post_verification',
        title: 'Verificación de Secuencia POST: Memoria RAM vs BIOS/CPU vs Salida de Video',
        category: 'measurement',
        description: 'Con el equipo encendido fijo sin dar video, conectar un teclado USB con cable y presionar repetidamente la tecla "Bloq Num" (Num Lock) o "Bloq Mayús", y observar los LEDs EZ-Debug (CPU -> DRAM -> VGA -> BOOT), pitidos del Buzzer o color del LED en consola (Luz Azul pulsante vs Luz Blanca fija).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Verificación de respuesta lógica de POST (Activación de LED Bloq Num en teclado USB)',
            tolerance: 'Si el LED del teclado prende y apaga, la máquina SÍ completó el POST y la falla es solo de video',
            referenceValues: {
              diodeDrop: 'N/A (Prueba funcional de POST)',
              nominalVoltage: 'VCORE: 0.9V - 1.2V | VDDQ RAM: 1.2V (DDR4) / 1.1V (DDR5)',
              usbCurrent: 'Teclado USB consume ~50mA y responde a Bloq Num si hay POST'
            }
          }
        ],
        technicalTips: 'Esta es la prueba de oro en el taller: si el teclado USB activa y desactiva la luz de Bloq Num (o si una PS4/PS5 pasa de luz azul a luz blanca fija), el procesador, la RAM y la BIOS ya arrancaron perfectamente; el problema está 100% en la salida de video (GPU / HDMI).',
        options: [
          {
            label: 'No hace POST: Se detiene en LED DRAM, emite pitidos de memoria o no da pitidos al quitar la RAM',
            targetNodeId: 'pcv_ram_diagnosis',
            badgeColor: 'yellow'
          },
          {
            label: 'No hace POST: Queda trabado en CPU/BIOS (VCore ausente, pila CMOS agotada o BIOS SPI corrupta)',
            targetNodeId: 'pcv_cpu_bios_check',
            badgeColor: 'red'
          },
          {
            label: 'SÍ completa POST (Teclado activa Bloq Num / Consola en Luz Blanca), pero no sale imagen al monitor/TV',
            targetNodeId: 'pcv_video_hdmi_gpu_check',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'pcv_ram_diagnosis',
        title: 'Descarte Profundo de Memoria RAM: Módulos, Slots y Alimentaciones VDDQ / VPP / SPD',
        category: 'measurement',
        description: 'Retirar los módulos de memoria RAM, limpiar sus contactos dorados con alcohol isopropílico y goma blanca, y probar un módulo sano conocido en cada slot. Si sigue sin inicializar, medir las tensiones del slot DIMM/SODIMM: VDDQ (1.20V DDR4 / 1.10V DDR5 / 1.35V DDR3L), VPP (2.5V), VTT (0.60V) y bus I2C SPD (3.3V).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VDDQ: 1.20V (DDR4) o 1.10V (DDR5) | VPP: 2.50V | VDDSPD: 3.30V',
            tolerance: '±0.05V en bobina principal de memoria RAM',
            referenceValues: {
              diodeDrop: 'Bobina RAM VDDQ: 0.180V - 0.320V',
              nominalVoltage: '1.20V DDR4 / 1.10V DDR5 / 1.35V GDDR6',
              usbCurrent: 'Sin inicialización de USB hasta superar etapa DRAM'
            }
          }
        ],
        technicalTips: 'En consolas (PS4/PS5/Xbox) o placas de video donde la RAM GDDR6 está soldada en BGA, un módulo desoldado detiene el arranque en Luz Azul pulsante (BLOD).',
        options: [
          {
            label: 'Tensiones de RAM correctas: El equipo da video tras limpiar contactos o reemplazar módulo RAM defectuoso',
            targetNodeId: 'pcv_verdict_ram_module_slot',
            badgeColor: 'green'
          },
          {
            label: 'Falta tensión de alimentación en la bobina de RAM (VDDQ 1.2V/1.1V o VPP 2.5V en 0V) o falla GDDR6 BGA',
            targetNodeId: 'pcv_verdict_ram_power_or_bga',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'pcv_cpu_bios_check',
        title: 'Verificación de VRM de CPU (VCORE), Pila RTC (3.0V) y Chip BIOS SPI Flash',
        category: 'measurement',
        description: 'Medir tensión de la pila CMOS CR2032 (mínimo 2.8V), comprobar presencia de tensión en las bobinas de CPU VCORE (0.85V - 1.25V) y verificar con osciloscopio o multímetro si hay lectura de datos en el Pin 1 (CS#) y Pin 6 (CLK) del chip de memoria BIOS SPI.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Tren de pulsos de lectura SPI en Pin 1 y Pin 6 de BIOS al dar orden de encendido',
            tolerance: 'Alimentación de BIOS Pin 8 debe ser 3.30V o 1.80V estables',
            referenceValues: {
              diodeDrop: 'Pines SPI BIOS: 0.420V - 0.550V',
              nominalVoltage: 'Pila RTC: 3.0V - 3.3V | VCORE: 0.9V - 1.2V',
              usbCurrent: '0.00A - 0.10A'
            }
          }
        ],
        technicalTips: 'Un corte de luz durante una actualización o la degradación de la región Intel ME / AMD AGESA corrompe el chip BIOS SPI dejando el equipo encendido con pantalla negra.',
        options: [
          {
            label: 'Todos los voltajes de CPU están presentes pero el sistema no avanza (BIOS SPI corrupta o CMOS desconfigurado)',
            targetNodeId: 'pcv_verdict_bios_reprogram',
            badgeColor: 'green'
          },
          {
            label: 'No hay voltaje en las bobinas de CPU VCORE (0.00V) o existen pines doblados en el socket del procesador',
            targetNodeId: 'pcv_verdict_vcore_pwm_socket',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'pcv_video_hdmi_gpu_check',
        title: 'Diagnóstico de Etapa de Salida de Video: Puerto HDMI / DisplayPort, Retimer IC y GPU',
        category: 'measurement',
        description: 'El equipo sí inicia el sistema (hay POST), pero no llega imagen a la pantalla. Inspeccionar bajo microscopio los 19 pines del puerto HDMI y medir en modo diodo los 4 pares diferenciales TMDS/FRL, los +5.0V del Pin 18, la señal Hot Plug Detect (Pin 19) y los filtros EMI / chip Retimer HDMI.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V - 0.620V parejos en las 8 líneas de datos HDMI (Pines 1, 3, 4, 6, 7, 9, 10, 12)',
            tolerance: 'Pines abiertos (OL) o en corto (0.000V) indican daño en puerto, filtro EMI o IC Retimer',
            referenceValues: {
              diodeDrop: 'Pares HDMI: ~0.520V | Pin 18 (+5V): ~0.480V | Pin 19 (HPD): ~0.650V',
              nominalVoltage: '+5.0V en Pin 18 de HDMI con equipo encendido',
              usbCurrent: 'Equipo en estado operativo normal'
            }
          }
        ],
        technicalTips: 'En consolas (PS4/PS5/Xbox) con Luz Blanca sin imagen, el 95% de las fallas se concentra en el conector HDMI roto físicamente, una bobina choke EMI abierta o el chip Retimer HDMI (Panasonic MN864739 / TI) quemado.',
        options: [
          {
            label: 'Puerto HDMI físicamente dañado, pines desoldados o filtro EMI / diodo ESD en corto',
            targetNodeId: 'pcv_verdict_hdmi_port_filter',
            badgeColor: 'green'
          },
          {
            label: 'Conector sano pero sin señal de video: Chip Retimer HDMI quemado o falla de alimentación en GPU dedicada',
            targetNodeId: 'pcv_verdict_retimer_or_gpu',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'pcv_overheating_thermal_check',
        title: 'Diagnóstico de Sobrecalentamiento: Pasta Térmica, Metal Líquido y Sistema de Disipación',
        category: 'inspection',
        description: 'Desmontar el sistema de refrigeración y evaluar la huella de contacto térmico sobre el die del CPU/GPU/APU: verificar si la pasta térmica está cristalizada, si el Metal Líquido (en PS5 o laptops gamer) se escurrió dejando una mancha seca oxidada, o si el heatpipe / bomba de refrigeración líquida perdió eficiencia.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Gradiente uniforme entre el bloque del procesador y las aletas del radiador (< 75°C)',
            tolerance: 'Si el procesador supera 95°C-105°C y el radiador está frío, el heatpipe o bomba falló',
            referenceValues: {
              diodeDrop: 'Sensor térmico NTC: 10kΩ - 100kΩ nominal a 25°C',
              nominalVoltage: 'Alimentación de Cooler: +12.0V (PC/Consola) o +5.0V (Laptop)',
              usbCurrent: 'Apagado térmico abrupto por señal THERMTRIP# / PROCHOT#'
            }
          }
        ],
        technicalTips: 'En consolas con metal líquido (PS5), nunca aplicar pasta térmica común en su lugar: se debe remover el óxido grisáceo del núcleo y del disipador con alcohol isopropílico e hisopo de algodón hasta recuperar el brillo espejo, y redistribuir metal líquido de grado técnico.',
        options: [
          {
            label: 'Pasta térmica seca, Metal Líquido desplazado con punto seco (Hotspot) o radiador obstruido',
            targetNodeId: 'pcv_verdict_thermal_maintenance',
            badgeColor: 'green'
          },
          {
            label: 'Heatpipe pinchado (no transfiere calor al radiador), cooler dañado o sensor térmico en placa averiado',
            targetNodeId: 'pcv_verdict_heatsink_fan_sensor',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'pcv_verdict_psu_fault',
        title: 'Veredicto: Fuente de Alimentación (PSU) Dañada / Caída de Tensión Bajo Carga',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La placa madre no presenta cortocircuitos en sus líneas de 12V, 5V ni 3.3V. La fuente de alimentación tiene capacitores electrolíticos secos en su etapa secundaria o falla en la señal Power Good (PG), cayendo al exigirle corriente.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '+12.0V, +5.0V y +3.3V firmes bajo carga con fuente de reemplazo',
            tolerance: 'Ripple < 50mV y señal PG en 5.0V'
          }
        ],
        technicalTips: 'Procedimiento: Sustituir la fuente de alimentación por una unidad certificada o reparar la etapa secundaria de filtrado y PFC de la fuente original.',
        options: []
      },
      {
        id: 'pcv_verdict_12v_vrm_mosfet',
        title: 'Veredicto: Cortocircuito en MOSFET High-Side / DrMOS del VRM de 12V',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Uno de los transistores MOSFET o etapas integradas DrMOS del regulador multifase de 12V (CPU/GPU/APU) se puso en cortocircuito, activando la protección instantánea de la fuente.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Recuperación de ~0.450V en la línea de 12V tras retirar el MOSFET/DrMOS dañado',
            tolerance: 'Verificar que la bobina del núcleo no esté en 0.00Ω antes de energizar'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el MOSFET/DrMOS averiado con precalentador y aire caliente a 390°C, medir el driver PWM asociado y reemplazar el componente por uno de idéntica especificación de corriente.',
        options: []
      },
      {
        id: 'pcv_verdict_12v_cap_short',
        title: 'Veredicto: Capacitor Cerámico MLCC en Cortocircuito en Línea de 12V',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Un capacitor cerámico multicapa (MLCC) de filtrado del riel de 12V sufrió perforación dieléctrica a masa, bloqueando el arranque de la fuente.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Impedancia alta restablecida (> 0.400V) en el riel de 12V',
            tolerance: 'Encendido inmediato sin protección OCP'
          }
        ],
        technicalTips: 'Procedimiento: Extraer el capacitor cerámico en corto y soldar un nuevo capacitor MLCC X7R de 10uF / 25V.',
        options: []
      },
      {
        id: 'pcv_verdict_5v_3v3_peripheral',
        title: 'Veredicto: Cortocircuito en Línea Secundaria de 5V o 3.3V (Chip Periférico / Regulador)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El cortocircuito en las líneas secundarias de 5V o 3.3V era producido por un integrado periférico (chip de red LAN, audio, controlador USB) o un regulador LDO perforado.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '+5.00V y +3.30V estables al retirar el componente en corto',
            tolerance: 'Secuencia de arranque normalizada'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el integrado periférico dañado con tobera fina, limpiar los pads y reemplazar el componente (si era el chip de red LAN o audio, la placa ya dará video inmediatamente al retirarlo).',
        options: []
      },
      {
        id: 'pcv_verdict_pch_southbridge_dead',
        title: 'Veredicto: Cortocircuito Interno en Chipset PCH / Southbridge',
        category: 'verdict',
        description: 'DIAGNÓSTICO CRÍTICO: El riel de 3.3V Standby / 1.8V presenta un cortocircuito directo hacia el interior del silicio del puente sur (PCH / Southbridge), disipando calor intenso al inyectar tensión.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Calentamiento directo en el die del PCH / Southbridge',
            tolerance: 'Requiere reemplazo de BGA o placa madre'
          }
        ],
        technicalTips: 'Procedimiento: En consolas (PS4/PS5) es viable reemplazar el IC Southbridge mediante estación BGA; en placas madre con PCH integrado en el SoC, evaluar costo de cambio de placa.',
        options: []
      },
      {
        id: 'pcv_verdict_ram_module_slot',
        title: 'Veredicto: Falla de Inicialización de Memoria RAM (Falso Contacto en Slot o Módulo Dañado)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La ausencia de video era provocada por un fallo en el entrenamiento de memoria (Memory Training) debido a sulfatación en el slot DIMM/SODIMM o un módulo RAM defectuoso.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'POST exitoso y salida de video inmediata en pantalla',
            tolerance: 'Estabilidad comprobada con test de memoria (MemTest86)'
          }
        ],
        technicalTips: 'Procedimiento: Limpieza profunda de bancos DIMM con limpia-contactos isopropílico, reemplazo del módulo RAM averiado y activación del perfil XMP/EXPO tras actualizar BIOS.',
        options: []
      },
      {
        id: 'pcv_verdict_ram_power_or_bga',
        title: 'Veredicto: Falla en Fuente Buck de RAM (VDDQ) o Desoldadura BGA en Memoria GDDR6',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito regulador PWM de la memoria RAM no entrega los 1.2V/1.1V nominales, o uno de los bancos de memoria BGA (GDDR6 / RAM soldada) presenta fisuras de soldadura.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Tensión VDDQ y VPP restablecida y paso del código POST de memoria',
            tolerance: '±3% de regulación'
          }
        ],
        technicalTips: 'Procedimiento: Reparar el convertidor Buck de memoria RAM en placa madre o realizar reballing del chip de memoria GDDR6 identificado por diagnóstico UART/MATS.',
        options: []
      },
      {
        id: 'pcv_verdict_bios_reprogram',
        title: 'Veredicto: Corrupción de Firmware BIOS SPI / Reset de RTC CMOS',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La placa cuenta con todas sus tensiones operativas pero el bloque de arranque en la memoria SPI Flash (BIOS / Región ME / AGESA) estaba corrupto.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Tráfico SPI continuo y superación completa del POST con imagen en pantalla',
            tolerance: 'Pila CMOS nueva en 3.20V'
          }
        ],
        technicalTips: 'Procedimiento: Extraer el chip BIOS SPI (25Q64 / 25Q128 / 25Q256), realizar copia de respaldo del binario original, grabar dump limpio con región ME/AGESA limpia en programadora externa y resoldar.',
        options: []
      },
      {
        id: 'pcv_verdict_vcore_pwm_socket',
        title: 'Veredicto: Ausencia de Alimentación CPU VCORE (Controlador PWM) o Daño en Socket',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El procesador no inicia porque el controlador PWM del VRM no habilita la tensión VCORE o existen pines doblados/aislados en el socket LGA/AM4/AM5.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '0.95V - 1.20V presentes en bobinas de CPU VCORE y señal VR_READY en alto',
            tolerance: 'Contacto íntegro en todos los pines del socket'
          }
        ],
        technicalTips: 'Procedimiento: Enderezar pines del socket bajo microscopio estereoscópico o sustituir el controlador PWM principal del VRM.',
        options: []
      },
      {
        id: 'pcv_verdict_hdmi_port_filter',
        title: 'Veredicto: Conector HDMI / Filtro EMI Dañado (Equipo con POST pero Sin Señal)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El equipo arrancaba correctamente pero la señal digital de video se interrumpía en el receptáculo HDMI o en sus bobinas de choque EMI / diodos ESD de salida.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Los 8 pines de pares diferenciales HDMI equilibrados en ~0.520V',
            tolerance: 'Salida de video estable en resolución nativa'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el puerto HDMI hembra y las bobinas choke EMI abiertas utilizando estaño 63/37 y verificando la solidez mecánica de las patas de anclaje.',
        options: []
      },
      {
        id: 'pcv_verdict_retimer_or_gpu',
        title: 'Veredicto: Circuito Integrado Retimer HDMI Averiado o Falla en Etapa GPU',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El chip codificador/retimer de señal HDMI (o la alimentación secundaria de la placa gráfica) se encuentra dañado, impidiendo la salida de video pese a superar el POST.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.3V y 1.8V estables en el Retimer HDMI y salida TMDS/FRL activa',
            tolerance: 'Imagen restaurada en monitor/TV'
          }
        ],
        technicalTips: 'Procedimiento: Sustituir el chip Retimer/Encoder HDMI (ej. Panasonic MN864739 en PS5, MN864729 en PS4 o TI SN75DP159 en Xbox) con estación de aire caliente a 370°C.',
        options: []
      },
      {
        id: 'pcv_verdict_thermal_maintenance',
        title: 'Veredicto: Corte Térmico por Pasta Seca o Punto Seco de Metal Líquido en APU/CPU',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El apagado y aceleración de ventiladores al 100% eran causados por falta de transferencia térmica entre el die del procesador y el disipador.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Temperatura bajo estrés sostenido estabilizada entre 60°C y 75°C',
            tolerance: 'Ventilador operando en curva acústica normal'
          }
        ],
        technicalTips: 'Procedimiento: Descontaminar el die de silicio y el bloque de cobre con alcohol isopropílico al 99%, pulir la mancha de oxidación y aplicar pasta térmica de alta conductividad (> 12 W/mK) o redistribuir Metal Líquido protegiendo los capacitores perimetrales.',
        options: []
      },
      {
        id: 'pcv_verdict_heatsink_fan_sensor',
        title: 'Veredicto: Disipador Heatpipe Pinchado, Cooler Averiado o Falla en Sensor PROCHOT#',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El sistema de enfriamiento perdió el gas refrigerante interno del tubo de calor (heatpipe/cámara de vapor), el motor del cooler no gira o el circuito sensor térmico envía una alerta falsa de sobretemperatura.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Señal PROCHOT# / THERMTRIP# en nivel lógico alto (3.3V) y giro continuo del cooler',
            tolerance: 'Transferencia de calor uniforme a lo largo de todo el heatpipe'
          }
        ],
        technicalTips: 'Procedimiento: Sustituir el conjunto disipador/cooler o reparar el divisor resistivo del sensor térmico NTC en la placa madre.',
        options: []
      }
    ]
  },
  {
    id: 'smartphone_no_power',
    name: 'Smartphone: Falla de Encendido y Consumo Anómalo en Placa',
    deviceType: 'Smartphone (iOS / Android)',
    description: 'Diagnóstico paso a paso a nivel de componentes para placas lógicas con fallo de encendido, cortocircuito en rieles primarios (VDD_MAIN / V_BAT), consumo congelado en boot y fallas en PMIC.',
    nodes: [
      {
        id: 'sp_start',
        title: 'Evaluación Inicial de Síntoma y Batería',
        category: 'symptom',
        description: 'Dispositivo ingresa apagado, no responde al botón de encendido ni muestra indicación de carga en pantalla. Se debe descartar primero batería en descarga profunda o puerto sucio.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.85V - 4.20V en bornes de batería',
            tolerance: '>= 3.70V para encendido mínimo'
          }
        ],
        technicalTips: 'Desconectar la batería inmediatamente si el dispositivo presenta olor a quemado o si se detecta calentamiento previo.',
        options: [
          {
            label: 'Batería con voltaje nominal correcto (>= 3.8V)',
            targetNodeId: 'sp_dc_connect',
            badgeColor: 'green'
          },
          {
            label: 'Batería por debajo de 2.8V o descargada por completo',
            targetNodeId: 'sp_batt_charge_test',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_batt_charge_test',
        title: 'Prueba de Carga Forzada y Sensado USB-C/Lightning',
        category: 'measurement',
        description: 'Conectar cargador con amperímetro USB para comprobar si el circuito de carga y el Tristar/Tigris/PMIC activan el protocolo de pre-carga.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: '5.0V / 1.0A a 2.1A',
            tolerance: '0.45A mínimo en modo pre-carga'
          }
        ],
        technicalTips: 'Un consumo oscilante de 0mA a 40mA cada 2 segundos suele indicar que el procesador no detecta la batería o falla la línea I2C de comunicación de gas gauge.',
        options: [
          {
            label: 'Consumo en amperímetro 0.00A absoluto (No detecta cargador)',
            targetNodeId: 'sp_diode_vbus',
            badgeColor: 'red'
          },
          {
            label: 'Consumo normal (> 1.0A) y batería recupera carga',
            targetNodeId: 'sp_verdict_battery_swap',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'sp_dc_connect',
        title: 'Inyección de Fuente DC antes de pulsar Power (Consumo en Reposo)',
        category: 'measurement',
        description: 'Conectar cable pulpo iPower / DC Bench Supply al conector de batería a 4.2V con límite de corriente de 2.0A. NO pulsar aún el botón de encendido.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: '0.000 A (0 mA)',
            tolerance: 'Máximo 0.003 A de tolerancia en reposo'
          }
        ],
        technicalTips: 'Cualquier consumo antes de presionar el botón de encendido indica una fuga o cortocircuito directo en una línea primaria siempre presente (V_BAT o VDD_MAIN).',
        options: [
          {
            label: 'Consumo en 0.000A (Comportamiento normal en reposo)',
            targetNodeId: 'sp_power_button_press',
            badgeColor: 'green'
          },
          {
            label: 'Corto Directo: La fuente cae a 0V e ingresa a protección CC (Consumo > 2A)',
            targetNodeId: 'sp_direct_short_analysis',
            badgeColor: 'red'
          },
          {
            label: 'Fuga secundaria: Consumo fijo entre 50mA y 450mA sin pulsar power',
            targetNodeId: 'sp_leak_thermal_scan',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_direct_short_analysis',
        title: 'Medición de Caída de Tensión (Modo Diodo) en Rieles Principales',
        category: 'measurement',
        description: 'Punta roja a tierra (GND / chasis blindaje) y punta negra sobre línea V_BAT y línea VDD_MAIN / VDD_BOOST para ubicar el riel en corto a tierra.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.380V - 0.490V en VDD_MAIN / 0.450V en V_BAT',
            tolerance: '0.000V - 0.005V indica corto pleno a GND'
          }
        ],
        technicalTips: 'Si V_BAT mide bien (> 0.400V) pero VDD_MAIN mide 0.000V, el corto está detrás del MOSFET conmutador principal de potencia.',
        options: [
          {
            label: '0.000V en riel VDD_MAIN (Corto absoluto)',
            targetNodeId: 'sp_thermal_rosin_test',
            badgeColor: 'red'
          },
          {
            label: '0.000V en conector directo de V_BAT',
            targetNodeId: 'sp_vbat_component_check',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_thermal_rosin_test',
        title: 'Localización Térmica por Inyección de Tensión Controlada',
        category: 'inspection',
        description: 'Aplicar humo de resina de colofonia (rosin) o utilizar cámara térmica infrarroja. Inyectar 1.2V con límite de 2A directamente sobre el riel VDD_MAIN.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Punto caliente localizado (> 45°C) en milisegundos',
            tolerance: 'No superar 1.5V para no degradar semiconductores'
          }
        ],
        technicalTips: 'NUNCA inyectar 4.2V con corriente ilimitada directamente; si un condensador está en corto, un exceso de corriente puede carbonizar las pistas internas de la placa multicapa.',
        options: [
          {
            label: 'Condensador de filtrado cerámico (MLCC) disipa calor y evapora el rosin',
            targetNodeId: 'sp_verdict_cap_short',
            badgeColor: 'green'
          },
          {
            label: 'El circuito integrado PMIC Principal calienta de forma generalizada',
            targetNodeId: 'sp_pmic_output_check',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sp_pmic_output_check',
        title: 'Verificación de Bobinas de Salida del PMIC',
        category: 'measurement',
        description: 'Medir en modo diodo todas las bobinas BUCK del PMIC hacia CPU, GPU y memoria RAM para determinar si el PMIC calienta por falla interna o por corto en una línea secundaria.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.080V a 0.350V según riel BUCK',
            tolerance: 'Líneas de CPU CORE suelen tener resistencias muy bajas de 0.015V a 0.050V de forma normal'
          }
        ],
        technicalTips: 'No confundir la baja impedancia natural de las fases de CPU/GPU con un cortocircuito. Usar una placa donante de referencia si hay dudas.',
        options: [
          {
            label: 'Todas las bobinas de salida miden con valores nominales normales',
            targetNodeId: 'sp_verdict_pmic_damage',
            badgeColor: 'red'
          },
          {
            label: 'Bobina de riel de alimentación de SoC/CPU en 0.000V absoluto',
            targetNodeId: 'sp_verdict_cpu_dead',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sp_leak_thermal_scan',
        title: 'Rastreo de Fuga Secundaria con Micro-amperímetro',
        category: 'inspection',
        description: 'La fuga de 50mA-450mA no suele ser suficiente para calentar a simple vista. Utilizar cámara térmica de alta resolución enfocando circuitos periféricos (Códec de Audio, Módulo WiFi, Tristar).',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Diferencia térmica mínima de +3°C a +7°C sobre temperatura ambiente',
            tolerance: 'Temperatura ambiente 22°C - 25°C'
          }
        ],
        technicalTips: 'Fugas de 150mA-250mA que no cambian suelen provenir del circuito de carga USB (Tristar / IC Hydra) dañado por cargadores vehiculares de mala calidad.',
        options: [
          {
            label: 'El IC de comunicaciones USB / Carga muestra elevación térmica',
            targetNodeId: 'sp_verdict_tristar_ic',
            badgeColor: 'yellow'
          },
          {
            label: 'Módulo de radiofrecuencia / Amplificador de potencia (PA) calienta',
            targetNodeId: 'sp_verdict_rf_pa',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_power_button_press',
        title: 'Análisis de Curva de Consumo tras Pulsar Botón Power',
        category: 'measurement',
        description: 'Pulsar el botón de encendido durante 1 segundo y observar el comportamiento de la aguja / display de la fuente de poder de 4 dígitos.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Secuencia dinámica: 0.08A -> 0.15A -> 0.35A -> 0.80A oscilando',
            tolerance: 'Subida progresiva sin congelarse'
          }
        ],
        technicalTips: 'El consumo de arranque es la firma digital del proceso de POST del smartphone. Un consumo fijo revela en qué fase del bootloader se detuvo el CPU.',
        options: [
          {
            label: 'Se congela en 50mA - 80mA estables (Fallo de bus I2C o RAM)',
            targetNodeId: 'sp_i2c_bus_inspection',
            badgeColor: 'yellow'
          },
          {
            label: 'Bucle infinito: sube a 180mA y cae a 0mA cada 3 segundos',
            targetNodeId: 'sp_bootloop_nand_test',
            badgeColor: 'yellow'
          },
          {
            label: 'Consumo normal completo (oscila hasta 1.1A), pero pantalla totalmente negra',
            targetNodeId: 'sp_screen_backlight_test',
            badgeColor: 'blue'
          },
          {
            label: 'No hay ninguna reacción al presionar (0.000A fijo constante)',
            targetNodeId: 'sp_pwr_line_volt',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sp_i2c_bus_inspection',
        title: 'Monitoreo de Líneas de Bus I2C / I3C con Osciloscopio',
        category: 'measurement',
        description: 'Revisar líneas I2C0_SCL y I2C0_SDA que comunican el procesador de aplicaciones con PMIC y sensores (cámara, display, sensor de proximidad).',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Tren de pulsos cuadrados de 1.8V a 400kHz',
            tolerance: 'Nivel lógico alto 1.75V - 1.85V'
          },
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.8V de Pull-up constante',
            tolerance: 'Tolerancia +/- 0.05V'
          }
        ],
        technicalTips: 'Una resistencia de pull-up abierta o un sensor en corto mantendrá la línea SDA en 0V, impidiendo que el CPU reciba el ACK del PMIC y congelando el encendido.',
        options: [
          {
            label: 'Línea SDA o SCL colapsada a 0V o con nivel bajo',
            targetNodeId: 'sp_verdict_i2c_short',
            badgeColor: 'red'
          },
          {
            label: 'Señales I2C correctas pero el CPU no inicia kernel',
            targetNodeId: 'sp_verdict_cpu_reballing',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_bootloop_nand_test',
        title: 'Verificación de Alimentaciones de Memoria NAND / UFS',
        category: 'measurement',
        description: 'Medir las tensiones de 0.9V (VCCQ), 1.8V y 2.8V/3.0V (VCC) de la memoria flash durante el pulso de inicio.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.0V VCC y 1.8V VCCQ presentes y estables',
            tolerance: 'Sin caídas durante el pulso de acceso'
          }
        ],
        technicalTips: 'Si se conecta el equipo al ordenador mediante USB, verificar si es reconocido en modo DFU / EDL (Emergency Download Mode 9008).',
        options: [
          {
            label: 'El ordenador detecta puerto DFU / EDL 9008 de recuperación',
            targetNodeId: 'sp_verdict_nand_corrupt',
            badgeColor: 'blue'
          },
          {
            label: 'Falta alimentación de 3.0V en condensador de filtro de la NAND',
            targetNodeId: 'sp_verdict_pmic_ldo',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_screen_backlight_test',
        title: 'Diagnóstico de Etapa de Retroiluminación (Backlight) / OLED',
        category: 'measurement',
        description: 'Si el equipo arranca pero no emite imagen, comprobar el circuito elevador Boost de retroiluminación o las líneas positivas y negativas del panel OLED (+5V / -5V o +15V a +40V ánodo).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '+18.0V a +24.0V en ánodo de diodo boost',
            tolerance: 'Sin luz de fondo suele quedar en 4.0V (tensión de batería)'
          }
        ],
        technicalTips: 'Comprobar siempre con un microscopio el filtro EMI / fusible de backlight cercano al conector FPC de pantalla antes de desoldar el IC driver.',
        options: [
          {
            label: 'Fusible / Filtro FL abierto (0V en conector FPC)',
            targetNodeId: 'sp_verdict_fuse_backlight',
            badgeColor: 'green'
          },
          {
            label: 'Diodo Schotkky o bobina Boost dañada / rajada',
            targetNodeId: 'sp_verdict_diode_boost',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sp_pwr_line_volt',
        title: 'Comprobación de la Línea de Botón de Encendido (BUTTON_PWR_KEY)',
        category: 'measurement',
        description: 'Medir el voltaje en el pin del pulsador. La línea debe tener 1.8V o VDD_MAIN por pull-up y caer a 0V momentáneamente al pulsar.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.80V en estado pasivo',
            tolerance: 'Cae a 0.00V al pulsar'
          }
        ],
        technicalTips: 'El flex de botones suele dañarse por humedad o rotura mecánica, simulando una placa muerta.',
        options: [
          {
            label: 'Voltaje de 1.8V presente pero no cae a 0V al pulsar (Flex roto)',
            targetNodeId: 'sp_verdict_flex_button',
            badgeColor: 'green'
          },
          {
            label: 'Voltaje en 0V permanente (Línea en corto o PMIC no emite pull-up)',
            targetNodeId: 'sp_verdict_pmic_damage',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sp_diode_vbus',
        title: 'Modo Diodo en Pines de Puerto USB / CC1 y CC2',
        category: 'measurement',
        description: 'Medir caída de tensión en pin VBUS (5V) y líneas de datos D+ / D- / CC1 / CC2 del puerto de carga.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.520V en VBUS / 0.650V en D+ y D-',
            tolerance: 'Tolerancia +/- 0.050V'
          }
        ],
        technicalTips: 'Una lectura de 0.000V en CC1 o CC2 indica daño en el multiplexor del conector o rotura física de pines.',
        options: [
          {
            label: 'Pin VBUS en circuito abierto (OL / infinito)',
            targetNodeId: 'sp_verdict_port_broken',
            badgeColor: 'green'
          },
          {
            label: 'Corto a tierra en pin VBUS (0.000V)',
            targetNodeId: 'sp_verdict_tvs_vbus',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sp_vbat_component_check',
        title: 'Inspección de Diodos TVS y MOSFET de Protección de Entrada',
        category: 'inspection',
        description: 'Revisar con microscopio los diodos supresores de transitorios (TVS) en paralelo con el conector de batería.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V en ánodo',
            tolerance: 'Cero ohmios indica diodo TVS perforado por sobretensión'
          }
        ],
        technicalTips: 'En caso de inversión de polaridad o sobretensión, el TVS se sacrifica para proteger el resto de la placa.',
        options: [
          {
            label: 'Diodo TVS en corto evidente',
            targetNodeId: 'sp_verdict_tvs_replace',
            badgeColor: 'green'
          },
          {
            label: 'Diodos correctos, el corto persiste hacia el interior de la placa',
            targetNodeId: 'sp_thermal_rosin_test',
            badgeColor: 'yellow'
          }
        ]
      },
      // VERDICT NODES
      {
        id: 'sp_verdict_cap_short',
        title: 'Veredicto: Condensador de Filtrado MLCC en Cortocircuito',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Uno o más condensadores cerámicos multicapa (MLCC) del riel VDD_MAIN sufrieron perforación dieléctrica, derivando toda la energía de la fuente a masa.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.380V - 0.450V tras retirar el componente defectuoso',
            tolerance: 'El valor nominal debe restablecerse de inmediato'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el condensador con estación de aire caliente a 350°C y flujo medio. Limpiar los pads con malla desoldadora. Reemplazar con condensador del mismo valor de capacitancia y voltaje nominal (mínimo 10V para líneas de 4V).',
        options: []
      },
      {
        id: 'sp_verdict_pmic_damage',
        title: 'Veredicto: PMIC Principal Dañado Internamente',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado de gestión de energía (Power Management IC - PMIC) presenta un fallo de silicio interno o daño térmico en sus etapas BUCK/LDO.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Disipación homogénea de temperatura normal tras sustitución',
            tolerance: 'No debe superar 40°C en reposo'
          }
        ],
        technicalTips: 'Procedimiento: Retirar resina epoxi de protección (underfill) con bisturí curvo a 220°C. Extraer IC a 380°C con tobera adecuada. Realizar limpieza minuciosa de pads en placa y colocar nuevo PMIC con esferas de estaño con plomo (Sn63/Pb37 a 183°C) para mayor confiabilidad.',
        options: []
      },
      {
        id: 'sp_verdict_tristar_ic',
        title: 'Veredicto: Circuito Integrado de Carga / USB Averiado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El controlador de interfaz USB y negociación de accesorios presenta fuga de corriente pasiva provocada por sobretensión en cargadores no certificados.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Consumo en reposo baja a 0.000A',
            tolerance: 'El consumo de reposo debe normalizarse'
          }
        ],
        technicalTips: 'Procedimiento: Reemplazar el IC Tristar/Hydra. Proteger el SoC adyacente con cinta Kapton y escudo térmico de cobre durante la soldadura.',
        options: []
      },
      {
        id: 'sp_verdict_battery_swap',
        title: 'Veredicto: Batería Agotada / Fallo en Circuito de Protección BMS',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La placa lógica no presenta cortocircuitos. La batería interna colapsó o su circuito BMS bloqueó la salida por descarga extrema.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.85V estable bajo carga',
            tolerance: 'Salud de batería > 80%'
          }
        ],
        technicalTips: 'Instalar batería nueva certificada y realizar ciclo completo de calibración de carga 0% a 100%.',
        options: []
      },
      {
        id: 'sp_verdict_cpu_dead',
        title: 'Veredicto: Cortocircuito Interno en Núcleo del Procesador (SoC)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CRÍTICO: La bobina de CPU CORE presenta 0.000V con corto total a tierra directamente bajo el encapsulado del procesador principal.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Corto irreversible',
            tolerance: '0.000V en CPU VDD'
          }
        ],
        technicalTips: 'Reparación no viable económicamente o inviable sin trasplante completo de combo CPU + NAND + Baseband a placa donante (Swap Board) para recuperación de datos.',
        options: []
      },
      {
        id: 'sp_verdict_fuse_backlight',
        title: 'Veredicto: Filtro / Fusible de Retroiluminación Abierto',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El fusible de protección de la línea de ánodo de la pantalla se quemó tras un pico de corriente (frecuente al conectar la pantalla con batería enchufada).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.001V de caída (continuidad completa) en ambos extremos del fusible',
            tolerance: '< 0.5 Ohm'
          }
        ],
        technicalTips: 'Reemplazar el filtro FL/fusible por uno del mismo valor (0.5A - 1A). Verificar que no haya corto en el conector de pantalla antes de encender.',
        options: []
      },
      {
        id: 'sp_verdict_port_broken',
        title: 'Veredicto: Puerto de Carga Dañado / Pista VBUS Rota',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El pin VBUS del puerto USB-C/Lightning se encuentra desoldado o roto internamente por fatiga mecánica.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.520V restaurado en VBUS',
            tolerance: 'Tolerancia +/- 0.030V'
          }
        ],
        technicalTips: 'Sustituir el flex de carga o desoldar y resoldar el conector con estaño de buena aleación y suficiente flux.',
        options: []
      },
      {
        id: 'sp_verdict_tvs_replace',
        title: 'Veredicto: Diodo de Protección TVS Perforado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El diodo supresor de transitorios cumplió su función y desvió una sobretensión a masa, quedando en cortocircuito permanente.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V nominal restaurado al retirar el diodo',
            tolerance: 'Riel liberado de masa'
          }
        ],
        technicalTips: 'Retirar el diodo con soldador de punta fina o aire caliente y reemplazarlo por un diodo TVS equivalente para mantener la protección activa contra descargas ESD.',
        options: []
      },
      {
        id: 'sp_verdict_i2c_short',
        title: 'Veredicto: Periférico Bloqueando el Bus de Comunicación I2C',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Un sensor periférico (comúnmente cámara frontal, sensor de luz ambiental o códec de audio) tiene fuga en su línea de datos, frenando el bus del sistema.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.8V restaurado en SDA y SCL',
            tolerance: 'Pulsos de datos activos'
          }
        ],
        technicalTips: 'Desconectar periféricos uno a uno hasta que la línea I2C recupere los 1.8V y el dispositivo arranque con éxito.',
        options: []
      },
      {
        id: 'sp_verdict_cpu_reballing',
        title: 'Veredicto: Esferas de Soldadura BGA Fisuradas en SoC/RAM',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Impacto mecánico por caída provocó microfisuras en el interposer BGA entre la memoria RAM y el procesador de aplicaciones.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Reloj y señal RESET estables',
            tolerance: 'Sin distorsión en ráfaga'
          }
        ],
        technicalTips: 'Se requiere procedimiento de Reballing de la capa RAM/CPU o Swap de placa mediante precalentador y plantilla stencil de precisión.',
        options: []
      },
      {
        id: 'sp_verdict_nand_corrupt',
        title: 'Veredicto: Partición del Kernel / Memoria Flash NAND Corrupta',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El hardware eléctrico está sano, pero la memoria de almacenamiento tiene bloques de sistema dañados o firmware bloqueado.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.0V y 1.8V presentes',
            tolerance: 'Tensiones correctas'
          }
        ],
        technicalTips: 'Intentar flasheo de sistema operativo mediante software especializado en modo de recuperación (DFU/EDL). Si arroja error 4013/4014 o fallo de I/O, programar memoria NAND con programadora especializada.',
        options: []
      },
      {
        id: 'sp_verdict_diode_boost',
        title: 'Veredicto: Bobina Elevadora / Diodo Schottky de Backlight Fisurado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El conversor elevador DC-DC de backlight no puede elevar la tensión por saturación magnética de la bobina o fuga en el diodo de conmutación.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Voltaje de salida boost > 18.0V',
            tolerance: 'Tensión nominal de iluminación'
          }
        ],
        technicalTips: 'Reemplazar en conjunto la bobina de 10uH-22uH y el diodo Schottky para evitar retornos de corriente indeseados.',
        options: []
      },
      {
        id: 'sp_verdict_flex_button',
        title: 'Veredicto: Flex Mecánico del Botón de Encendido Roto',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La placa madre responde al forzar el encendido puenteando el pad PWR_ON a GND con pinzas, pero el botón físico no cierra el circuito.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '0V en pad al pulsar el botón mecánico',
            tolerance: 'Continuidad comprobada'
          }
        ],
        technicalTips: 'Sustituir el cable flex del botón de encendido y volumen por un repuesto nuevo original.',
        options: []
      },
      {
        id: 'sp_verdict_rf_pa',
        title: 'Veredicto: Fuga en Amplificador de Potencia RF (Power Amp)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El módulo de amplificación de bandas celulares presenta fuga interna en el riel VDD_MAIN derivando corriente a tierra.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Temperatura desciende al valor ambiente tras retirar el IC',
            tolerance: 'Fuga eliminada'
          }
        ],
        technicalTips: 'Retirar el blindaje de la zona de radiofrecuencia con fresadora de precisión o calor controlado, aislar el IC dañado y reemplazar con IC de la misma variante de banda.',
        options: []
      },
      {
        id: 'sp_verdict_pmic_ldo',
        title: 'Veredicto: Salida de Regulador LDO del PMIC Inactiva',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El regulador lineal LDO que suministra los 3.0V de la memoria NAND no se activa debido a daño en el circuito de control del PMIC.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.00V en capacitor de salida LDO',
            tolerance: 'Estable tras sustitución del PMIC'
          }
        ],
        technicalTips: 'Reemplazar el circuito integrado PMIC o instalar un puente regulador bypass si es aplicable según el esquemático.',
        options: []
      },
      {
        id: 'sp_verdict_tvs_vbus',
        title: 'Veredicto: Diodo TVS de Línea VBUS en Corto',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El pin de 5V del conector USB se encuentra cortocircuitado a tierra por el diodo de protección TVS, bloqueando todo intento de carga.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.520V restaurado en VBUS',
            tolerance: 'El cargador deja de entrar en protección'
          }
        ],
        technicalTips: 'Retirar el diodo TVS de la línea VBUS y soldar un repuesto con capacidad de hasta 20V para compatibilidad con Power Delivery.',
        options: []
      }
    ]
  },
  {
    id: 'smartphone_screen_touch',
    name: 'Smartphone: Fallas de Pantalla, Imagen y Táctil',
    deviceType: 'Smartphone (OLED / LCD)',
    description: 'Protocolo exhaustivo de diagnóstico para fallas de imagen ausente, pantalla negra con/sin sonido, backlight inoperativo, líneas diferenciales MIPI DSI, rieles de polarización (+5V/-5V o VDD/VSP/VSN) y bus I2C de táctil (Touch).',
    nodes: [
      {
        id: 'spt_start',
        title: 'Evaluación del Estado Operativo Inicial (Sonido vs Silencio)',
        category: 'symptom',
        description: 'Dispositivo ingresa con pantalla completamente negra o sin imagen visible. Se debe determinar si la placa madre (Motherboard) inicia el sistema operativo o si el equipo está totalmente apagado.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: '0.45A a 1.80A dinámico al conectar USB',
            tolerance: '0.00A indica apagado total / falla de carga',
            referenceValues: {
              diodeDrop: 'N/A (Prueba funcional de puerto)',
              nominalVoltage: '5.0V / 9.0V VBUS',
              usbCurrent: '1.00A - 1.80A en boot normal / 0.00A en falla primaria'
            }
          }
        ],
        technicalTips: 'Conectar a cargador o forzar encendido y prestar atención a vibración del motor háptico, sonidos de inicio o reconocimiento por PC en administrador de dispositivos.',
        options: [
          {
            label: 'Equipo emite sonido/vibración o es detectado por PC (Placa bootea pero sin imagen)',
            targetNodeId: 'spt_fpc_visual_inspection',
            badgeColor: 'blue'
          },
          {
            label: 'Equipo en silencio absoluto: 0.00A en amperímetro USB y sin vibración',
            targetNodeId: 'spt_no_sound_power_check',
            badgeColor: 'red'
          },
          {
            label: 'Hay imagen pero el digitalizador táctil (Touch) no responde en ninguna zona',
            targetNodeId: 'spt_touch_inspection',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'spt_no_sound_power_check',
        title: 'Descarte de Falla de Encendido General vs Display Apagado',
        category: 'measurement',
        description: 'Al no haber sonido, vibración ni consumo de carga, el problema no es necesariamente la pantalla. Conectar a fuente DC regulada para comprobar consumo en arranque.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: '80mA - 150mA al pulsar power escalonado hacia 1.2A',
            tolerance: '0.000A fijo o corto pleno a tierra',
            referenceValues: {
              diodeDrop: '0.380V - 0.450V en V_BAT',
              nominalVoltage: '3.85V - 4.20V DC',
              usbCurrent: '0.000A absoluto'
            }
          }
        ],
        technicalTips: 'Si la fuente muestra 0.000A o un corto antes de presionar power, debe derivarse al árbol de falla de encendido y cortocircuitos primarios.',
        options: [
          {
            label: 'Fuente muestra ciclo de arranque normal (80mA -> 300mA -> 800mA oscilante) -> Placa sí enciende',
            targetNodeId: 'spt_fpc_visual_inspection',
            badgeColor: 'green'
          },
          {
            label: 'Fuente en 0.000A estricto o consumo congelado en 20mA - 60mA sin boot',
            targetNodeId: 'spt_verdict_no_boot',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'spt_fpc_visual_inspection',
        title: 'Inspección Microscópica del Conector FPC y Descarte Mecánico',
        category: 'inspection',
        description: 'Inspeccionar bajo microscopio óptico los pines machos y hembras del conector FPC de pantalla en la placa base y en el flex del display. Verificar si hay deformaciones por presión incorrecta, sulfato o anclajes de chapa desprendidos.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Continuidad 0.00Ω en anclajes metálicos a GND',
            tolerance: '< 0.5Ω con respecto al chasis',
            referenceValues: {
              diodeDrop: '0.000V en anclajes GND / 300-600mV en pines de señal',
              nominalVoltage: '0.00V en reposo',
              usbCurrent: 'No aplica (inspección microscópica)'
            }
          }
        ],
        technicalTips: 'Los conectores FPC de paso fino (0.35mm o 0.4mm) suelen fracturar sus soldaduras perimetrales tras caídas severas, o deformar los pines laterales de masa y alimentación por inserción con palancas plásticas.',
        options: [
          {
            label: 'Conector FPC con pines doblados, sulfato o pistas sueltas desoldadas del PCB',
            targetNodeId: 'spt_verdict_fpc_repair',
            badgeColor: 'red'
          },
          {
            label: 'Conector FPC físicamente intacto, sin deformaciones ni corrosión',
            targetNodeId: 'spt_display_type_branch',
            badgeColor: 'green'
          }
        ]
      },
      {
        id: 'spt_display_type_branch',
        title: 'Identificación de Tecnología de Panel: OLED / AMOLED vs LCD con Backlight',
        category: 'action',
        description: 'Determinar la arquitectura del módulo de pantalla para aplicar el protocolo correcto: los paneles LCD requieren circuito de elevación de luz (Backlight Boost), mientras que los paneles OLED son autoemisivos y dependen de convertidores simétricos de polarización (+5V / -5V o VDD/VSP/VSN).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Identificación de riel VOUT_BOOST (LCD) o VSP/VSN (OLED)',
            tolerance: 'Voltajes condicionados por activación de SoC',
            referenceValues: {
              diodeDrop: '350 - 550 mV en rieles de alimentación',
              nominalVoltage: '16V-28V (LCD Boost) / ±5.0V (OLED Bias)',
              usbCurrent: '1.0A - 1.5A durante intento de encendido'
            }
          }
        ],
        technicalTips: 'En paneles LCD, iluminar la pantalla con una linterna potente a contraluz; si se visualiza el logo tenue de inicio sin brillo, la falla es 100% de la etapa de Backlight.',
        options: [
          {
            label: 'Panel LCD: Imagen tenue visible con linterna (Falla de iluminación / Backlight)',
            targetNodeId: 'spt_backlight_anode_test',
            badgeColor: 'yellow'
          },
          {
            label: 'Panel OLED / AMOLED: Pantalla 100% negra sin emisión (Falla de Polarización VSP/VSN o Display IC)',
            targetNodeId: 'spt_oled_rails_test',
            badgeColor: 'blue'
          },
          {
            label: 'Panel LCD sin imagen visible ni siquiera con linterna (Posible falla de datos MIPI o VDD)',
            targetNodeId: 'spt_mipi_diode_test',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'spt_backlight_anode_test',
        title: 'Medición de Ánodo de Backlight (VOUT_BOOST) y Cátodos',
        category: 'measurement',
        description: 'Medir en el ánodo del conector de backlight con multímetro en voltaje con el equipo encendido. El convertidor Boost debe elevar la tensión de batería (3.8V) hasta 16V - 28V según la matriz de LEDs del panel.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '16.0V - 26.0V en línea LED_ANODE / VOUT_BOOST encendido',
            tolerance: '3.8V en reposo (indica que el circuito boost no conmuta)',
            referenceValues: {
              diodeDrop: '0.450V - 0.600V (Ánodo en modo diodo)',
              nominalVoltage: '16.0V - 28.0V (Boost activo) / 3.8V (Falla de oscilación)',
              usbCurrent: '0.90A - 1.40A dinámico'
            }
          }
        ],
        technicalTips: 'Si en el ánodo sólo se leen 3.8V (voltaje de batería V_BAT), la bobina de elevación o el diodo Schottky están permitiendo paso en continua pero el driver de backlight no está conmutando en alta frecuencia (PWM).',
        options: [
          {
            label: '0.00V en Ánodo: Línea cortada, fusible/filtro de backlight abierto o corto a tierra',
            targetNodeId: 'spt_backlight_diode_check',
            badgeColor: 'red'
          },
          {
            label: '3.8V a 4.2V fijo en Ánodo (No eleva a 18V-24V al encender)',
            targetNodeId: 'spt_backlight_ic_coil_test',
            badgeColor: 'yellow'
          },
          {
            label: 'Voltaje de elevación correcto (> 18V) pero pantalla sigue sin luz',
            targetNodeId: 'spt_verdict_screen_led_strip_dead',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'spt_backlight_diode_check',
        title: 'Medición en Modo Diodo en Línea LED_ANODE y Fusible de Luz',
        category: 'measurement',
        description: 'Punta roja a GND y punta negra en el pin de Ánodo del conector FPC y antes/después del fusible o bobina de protección.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V - 0.620V en ánodo de backlight',
            tolerance: '0.000V indica diodo TVS o capacitor en corto / OL indica fusible abierto',
            referenceValues: {
              diodeDrop: '450 - 620 mV',
              nominalVoltage: '0.00V con equipo desconectado',
              usbCurrent: '0.00A'
            }
          }
        ],
        technicalTips: 'El fusible de backlight suele quemarse cuando se conecta o desconecta la pantalla con la batería enchufada.',
        options: [
          {
            label: '0.000V: Corto pleno a tierra en capacitor de filtro de 25V o diodo TVS',
            targetNodeId: 'spt_verdict_backlight_short_cap',
            badgeColor: 'red'
          },
          {
            label: 'OL (Línea abierta): Fusible de luz o inductor de filtrado quemado',
            targetNodeId: 'spt_verdict_backlight_fuse_open',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'spt_backlight_ic_coil_test',
        title: 'Diagnóstico de Bobina de Boost, Diodo Schottky y Driver IC',
        category: 'inspection',
        description: 'Inspeccionar con cámara térmica o multímetro el conjunto boost: bobina de 10uH / 4.7uH, diodo Schottky de alta velocidad y driver de backlight.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.180V - 0.320V de caída directa en el diodo Schottky',
            tolerance: '0.000V o OL indica diodo Schottky destruido',
            referenceValues: {
              diodeDrop: '180 - 320 mV en Schottky / 450 - 550 mV en SW node',
              nominalVoltage: '3.8V a 4.2V en entrada de bobina',
              usbCurrent: 'Consumo oscilante en fuente'
            }
          }
        ],
        technicalTips: 'Una bobina de elevación fisurada internamente pierde inductancia y es incapaz de acumular energía magnética para elevar el voltaje, aunque mida continuidad ohmica.',
        options: [
          {
            label: 'Diodo Schottky quemado (abierto o en fuga con caída anormal)',
            targetNodeId: 'spt_verdict_schottky_replace',
            badgeColor: 'red'
          },
          {
            label: 'Bobina fisurada o driver IC de backlight no recibe señal EN (Enable / PWM)',
            targetNodeId: 'spt_verdict_backlight_ic_coil_replace',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'spt_oled_rails_test',
        title: 'Medición de Rieles de Polarización OLED (VSP / VSN y VDD)',
        category: 'measurement',
        description: 'En pantallas OLED, el circuito PMIC de Display (Bias IC) genera tensiones simétricas para polarizar los píxeles: VSP (+4.6V a +5.5V) y VSN (-4.4V a -5.5V), además de riel lógico VDD_1V8 o 3.0V. Medir con multímetro en voltios al pulsar power.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VSP: +4.6V a +5.5V | VSN: -4.4V a -5.5V',
            tolerance: '±0.2V de tolerancia nominal con pantalla conectada',
            referenceValues: {
              diodeDrop: 'VSP: 0.450V - 0.550V | VSN: 0.500V - 0.650V',
              nominalVoltage: 'VSP: +5.0V | VSN: -5.0V',
              usbCurrent: '1.10A - 1.60A durante arranque'
            }
          }
        ],
        technicalTips: 'La mayoría de los controladores OLED cortan los rieles VSP y VSN tras 2 segundos si no reciben respuesta en la línea I2C de identificación del display o si detectan sobrecorriente.',
        options: [
          {
            label: 'Rieles VSP (+5V) y VSN (-5V) presentes y estables',
            targetNodeId: 'spt_mipi_diode_test',
            badgeColor: 'green'
          },
          {
            label: '0.00V en VSP o VSN: IC de Bias no conmuta o riel en cortocircuito',
            targetNodeId: 'spt_oled_diode_mode_rails',
            badgeColor: 'red'
          },
          {
            label: 'Voltajes presentes pero pantalla OLED muestra líneas de colores o mancha morada/negra',
            targetNodeId: 'spt_verdict_oled_panel_cracked',
            badgeColor: 'blue'
          }
        ]
      },
      {
        id: 'spt_oled_diode_mode_rails',
        title: 'Medición en Modo Diodo en Rieles VSP y VSN a Tierra',
        category: 'measurement',
        description: 'Con el equipo desenergizado, medir en modo diodo con punta roja a GND sobre las líneas VSP y VSN en el conector FPC.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'VSP: 0.450V - 0.550V | VSN: 0.500V - 0.650V',
            tolerance: '< 0.050V indica corto en capacitor de filtrado o diodo interno de IC',
            referenceValues: {
              diodeDrop: '450 - 650 mV',
              nominalVoltage: '0.00V desconectado',
              usbCurrent: '0.00A'
            }
          }
        ],
        technicalTips: 'Los capacitores cerámicos multicapa (MLCC) en el riel negativo VSN (-5V) sufren estrés dieléctrico elevado y suelen ponerse en corto fugitivo.',
        options: [
          {
            label: 'Cortocircuito (0.000V) en VSP o VSN: Capacitor de filtro o IC dañado',
            targetNodeId: 'spt_verdict_oled_bias_cap_short',
            badgeColor: 'red'
          },
          {
            label: 'Caída de diodo normal en ambos rieles, pero el IC no entrega voltaje (Falla de IC Bias)',
            targetNodeId: 'spt_verdict_oled_ic_replace',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'spt_mipi_diode_test',
        title: 'Medición de Líneas de Datos MIPI DSI en Modo Diodo',
        category: 'measurement',
        description: 'Medir las líneas diferenciales de alta velocidad MIPI (CLK_P, CLK_N, DATA0_P, DATA0_N, DATA1_P, DATA1_N, DATA2, DATA3) en el conector FPC con punta roja a GND y punta negra en cada pin.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.350V - 0.450V en todos los pares diferenciales',
            tolerance: 'Diferencia máxima de ±15mV entre pares; 0.000V o OL indica falla crítica',
            referenceValues: {
              diodeDrop: '350 - 450 mV (Equilibrio simétrico)',
              nominalVoltage: '0.20V - 0.40V en operación dinámica',
              usbCurrent: 'No aplica (medición en frío)'
            }
          }
        ],
        technicalTips: 'Cada par diferencial MIPI atraviesa filtros de modo común (EMI Filters / perlas de choque). Un golpe puede quebrar un filtro internamente, dejando una sola línea en OL (Open Line).',
        options: [
          {
            label: 'Todas las líneas MIPI miden simétricas (350mV - 450mV, delta < 15mV)',
            targetNodeId: 'spt_screen_swap_test',
            badgeColor: 'green'
          },
          {
            label: 'Una o más líneas MIPI en OL (Línea abierta hacia CPU)',
            targetNodeId: 'spt_mipi_filter_check',
            badgeColor: 'yellow'
          },
          {
            label: 'Una línea MIPI en corto a tierra (0.000V)',
            targetNodeId: 'spt_verdict_mipi_tvs_short',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'spt_mipi_filter_check',
        title: 'Inspección de Filtros EMI de Modo Común de Bus MIPI',
        category: 'inspection',
        description: 'Localizar los filtros de 4 pines cerca del conector FPC o del procesador. Medir continuidad a través de cada canal del filtro para determinar si está abierto.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.00Ω / 0.001V de lado a lado del filtro',
            tolerance: 'OL a través del filtro indica bobina interna abierta',
            referenceValues: {
              diodeDrop: '0 - 5 mV continuidad a través del filtro / 400 mV hacia CPU',
              nominalVoltage: '0.00V',
              usbCurrent: '0.00A'
            }
          }
        ],
        technicalTips: 'Si el filtro está quebrado, se puede puentear provisionalmente de lado a lado con alambre de jumper 0.02mm o sustituir por un filtro nuevo de donante.',
        options: [
          {
            label: 'Filtro EMI abierto internamente: Pista no llega al procesador',
            targetNodeId: 'spt_verdict_mipi_filter_bridge',
            badgeColor: 'yellow'
          },
          {
            label: 'Filtro EMI en buen estado, pero línea sigue en OL hacia el procesador (Pads BGA de CPU desoldados)',
            targetNodeId: 'spt_verdict_cpu_mipi_fracture',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'spt_screen_swap_test',
        title: 'Prueba de Descarte Cruzado con Módulo de Pantalla Nuevo / Original',
        category: 'action',
        description: 'Con voltajes, líneas MIPI y conector FPC en rango de laboratorio, conectar un módulo de pantalla nuevo de calidad conocida.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Reconocimiento y activación de backlight / píxeles',
            tolerance: 'Respuesta inmediata en panel',
            referenceValues: {
              diodeDrop: 'Valores nominales verificados en pasos anteriores',
              nominalVoltage: '3.8V VDD / 1.8V VIO',
              usbCurrent: '1.2A - 1.8A con pantalla iluminada'
            }
          }
        ],
        technicalTips: 'Muchos módulos genéricos de baja calidad no son compatibles con actualizaciones recientes de firmware del controlador de pantalla (Touch IC / Display IC).',
        options: [
          {
            label: 'Pantalla nueva da imagen nítida y funciona perfectamente',
            targetNodeId: 'spt_verdict_screen_damaged',
            badgeColor: 'green'
          },
          {
            label: 'Pantalla nueva sigue sin dar imagen a pesar de mediciones correctas',
            targetNodeId: 'spt_verdict_display_pmic_cpu_dead',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'spt_touch_inspection',
        title: 'Diagnóstico de Líneas de Táctil (Touch I2C / SPI: SCL, SDA, INT, RST)',
        category: 'measurement',
        description: 'La pantalla da imagen pero el táctil no responde. Medir en el conector FPC las líneas de comunicación I2C (SCL, SDA, INT, RST) y el riel de alimentación VDD_TOUCH (1.8V / 3.3V).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V - 0.580V en SDA, SCL, INT y RST | 0.400V en VDD_TOUCH',
            tolerance: 'Tolerancia de ±30mV entre SDA y SCL',
            referenceValues: {
              diodeDrop: '450 - 580 mV en I2C / 400 mV en VDD_TOUCH',
              nominalVoltage: '1.8V en SDA/SCL pull-up / 3.3V en VDD',
              usbCurrent: 'Consumo normal de equipo operativo'
            }
          }
        ],
        technicalTips: 'Si la línea INT (Interrupción) está en 0.000V o desconectada (OL), el procesador nunca se entera de que el usuario está tocando la pantalla, provocando parálisis total del touch.',
        options: [
          {
            label: 'Líneas I2C y VDD_TOUCH con caídas de tensión y voltajes nominales correctos',
            targetNodeId: 'spt_verdict_touch_panel_dead',
            badgeColor: 'yellow'
          },
          {
            label: '0.000V o OL en línea INT (Interrupción) o RST (Reset)',
            targetNodeId: 'spt_verdict_touch_int_rst_fault',
            badgeColor: 'red'
          },
          {
            label: 'Falta alimentación VDD_TOUCH (1.8V o 3.3V ausente en regulador LDO)',
            targetNodeId: 'spt_verdict_touch_ldo_dead',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'spt_verdict_fpc_repair',
        title: 'Veredicto: Conector FPC Dañado Mecánicamente / Pistas Arrancadas',
        category: 'verdict',
        description: 'Se detectaron pines deformados o pistas arrancadas en el conector FPC de pantalla. Se requiere enderezado microquirúrgico, reconstrucción de pistas con micro-jumper 0.02mm o reemplazo completo del conector FPC con estación de aire caliente a 320°C y aleación 138°C/183°C.',
        measurements: [],
        technicalTips: 'Proteger componentes plásticos aledaños con cinta Kapton o blindaje térmico de cobre.',
        options: []
      },
      {
        id: 'spt_verdict_screen_damaged',
        title: 'Veredicto: Módulo de Pantalla Internamente Dañado (Placa Lógica 100% Sana)',
        category: 'verdict',
        description: 'Todas las mediciones en placa madre (alimentación VSP/VSN, Boost de backlight, bus de datos MIPI e I2C de táctil) se encuentran dentro de los parámetros nominales de fábrica. El módulo de pantalla original tiene daño físico en el cristal líquido, matriz OLED o flexor integrado. Reparación: Sustitución de módulo de pantalla.',
        measurements: [],
        technicalTips: 'Recomendar instalación de repuesto original o calidad Service Pack para preservar tasa de refresco (90Hz/120Hz) y calibración de color.',
        options: []
      },
      {
        id: 'spt_verdict_screen_led_strip_dead',
        title: 'Veredicto: Tira LED de Backlight en Panel LCD Abierta / Destruida',
        category: 'verdict',
        description: 'El circuito elevador Boost en la placa madre funciona a la perfección y eleva la tensión a más de 18V-25V. Sin embargo, la tira de LEDs internos en el panel LCD se encuentra en circuito abierto (quemada o flexor rasgado). Reparación: Sustitución del módulo de pantalla LCD.',
        measurements: [],
        technicalTips: 'No intentar reparar tiras de LEDs microscópicas en módulos de celular compactos sellados.',
        options: []
      },
      {
        id: 'spt_verdict_schottky_replace',
        title: 'Veredicto: Diodo Schottky de Backlight en Cortocircuito / Fuga',
        category: 'verdict',
        description: 'El diodo elevador Schottky de la etapa de backlight está destruido, impidiendo la conmutación a 20V+. Procedimiento: Reemplazar el diodo Schottky por uno de igual corriente (mínimo 40V / 2A de conmutación ultrarrápida).',
        measurements: [],
        technicalTips: 'Verificar siempre el estado de la bobina de boost asociada antes de energizar la placa.',
        options: []
      },
      {
        id: 'spt_verdict_backlight_fuse_open',
        title: 'Veredicto: Fusible / Filtro de Backlight Abierto',
        category: 'verdict',
        description: 'El fusible SMD de 0Ω en la línea de ánodo de backlight se abrió por un pico de sobrecorriente al conectar la pantalla con batería enchufada. Procedimiento: Reemplazar el fusible SMD 0402 de 2A o realizar puente de seguridad.',
        measurements: [],
        technicalTips: 'Desconectar siempre la fuente y la batería antes de manipular cualquier conector de pantalla.',
        options: []
      },
      {
        id: 'spt_verdict_backlight_short_cap',
        title: 'Veredicto: Cortocircuito a Tierra en Línea de Alta Tensión de Backlight',
        category: 'verdict',
        description: 'Un capacitor cerámico multicapa de 25V o 35V en la salida del ánodo de backlight se perforó a masa. Procedimiento: Localizar con cámara térmica o rocío de colofonia e inyección de 4V; sustituir el capacitor averiado.',
        measurements: [],
        technicalTips: 'Utilizar siempre un capacitor de repuesto con dieléctrico X7R y tensión de ruptura no menor a 25V.',
        options: []
      },
      {
        id: 'spt_verdict_backlight_ic_coil_replace',
        title: 'Veredicto: Bobina de Boost Fisurada o Driver IC de Backlight Defectuoso',
        category: 'verdict',
        description: 'La bobina elevadora no acumula flujo magnético o el driver IC no emite los pulsos PWM de modulación. Procedimiento: Sustituir la bobina de 10uH/4.7uH y resoldar/cambiar el circuito integrado controlador de backlight.',
        measurements: [],
        technicalTips: 'Comprobar la señal PWM proveniente del SoC con osciloscopio en el pin de Enable.',
        options: []
      },
      {
        id: 'spt_verdict_oled_bias_cap_short',
        title: 'Veredicto: Cortocircuito en Riel de Polarización OLED (VSP o VSN)',
        category: 'verdict',
        description: 'Capacitor de desacoplo en el riel negativo VSN (-5V) o positivo VSP (+5V) en corto pleno a masa. Procedimiento: Extraer el componente dañado y verificar recuperación de la caída de tensión a 500mV+.',
        measurements: [],
        technicalTips: 'No inyectar tensiones inversas en el riel VSN; inyectar como máximo 2.5V con límite de 1.5A.',
        options: []
      },
      {
        id: 'spt_verdict_oled_ic_replace',
        title: 'Veredicto: Circuito Integrado de Polarización OLED (Bias IC) Dañado',
        category: 'verdict',
        description: 'El convertidor DC-DC de pantalla OLED recibe voltaje de batería pero no genera las salidas simétricas VSP/VSN. Procedimiento: Reemplazar el PMIC de Display (ej. SM5109, TPS65633 o equivalente).',
        measurements: [],
        technicalTips: 'Aplicar micro-bolas de soldadura 183°C o estaño en pasta 183°C para reballing del IC.',
        options: []
      },
      {
        id: 'spt_verdict_oled_panel_cracked',
        title: 'Veredicto: Matriz OLED Microfisurada (Oxidación Interna de Píxeles)',
        category: 'verdict',
        description: 'El panel OLED sufrió una fisura interna que rompió la barrera de vacío, provocando manchas negras progresivas o líneas verticales verdes/púrpuras. La placa base opera correctamente. Reparación: Sustitución de pantalla.',
        measurements: [],
        technicalTips: 'Advertir al cliente que el daño es irreversible a nivel de microelectrónica de placa.',
        options: []
      },
      {
        id: 'spt_verdict_mipi_filter_bridge',
        title: 'Veredicto: Filtro EMI de Bus MIPI Fracturado',
        category: 'verdict',
        description: 'Uno de los filtros de modo común que comunican el procesador con la pantalla está abierto por impacto. Procedimiento: Realizar micro-puente con hilo esmaltado de 0.02mm o sustituir el filtro por uno nuevo.',
        measurements: [],
        technicalTips: 'Mantener los jumpers lo más cortos y rectos posibles para evitar desbalance de impedancia en alta frecuencia (1 GHz+).',
        options: []
      },
      {
        id: 'spt_verdict_mipi_tvs_short',
        title: 'Veredicto: Diodo de Protección ESD/TVS en Bus MIPI en Cortocircuito',
        category: 'verdict',
        description: 'Un supresor de transitorios TVS en una de las líneas de datos MIPI derivó a tierra por una descarga estática. Procedimiento: Remover el diodo TVS en corto y verificar la restauración de 400mV en modo diodo.',
        measurements: [],
        technicalTips: 'Si bien el equipo da imagen sin el TVS, se recomienda instalar uno nuevo para protección ESD.',
        options: []
      },
      {
        id: 'spt_verdict_cpu_mipi_fracture',
        title: 'Veredicto: Fisura de Soldadura BGA en Procesador (Líneas MIPI Desconectadas)',
        category: 'verdict',
        description: 'La línea de datos MIPI se encuentra en circuito abierto (OL) directo debajo del procesador (SoC). Causado por flexión del chasis o impacto fuerte. Procedimiento: Reballing o reflow controlado de CPU.',
        measurements: [],
        technicalTips: 'Operación de alta complejidad que requiere torno CNC para blindajes y perfil térmico preciso.',
        options: []
      },
      {
        id: 'spt_verdict_touch_panel_dead',
        title: 'Veredicto: Controlador Digitalizador Táctil en Flexor Averiado',
        category: 'verdict',
        description: 'Con todas las líneas I2C y voltajes presentes en placa, el chip digitalizador del display no responde. Reparación: Sustitución del módulo de pantalla completo.',
        measurements: [],
        technicalTips: 'Comprobar si el flexor del touch tiene cortes microscópicos en la unión con el vidrio.',
        options: []
      },
      {
        id: 'spt_verdict_touch_int_rst_fault',
        title: 'Veredicto: Falla en Línea de Interrupción INT o Reset de Touch',
        category: 'verdict',
        description: 'La línea INT o RST presenta cortocircuito a masa o resistencia pull-up quemada en placa. Procedimiento: Sustituir resistor de pull-up de 2.2kΩ / 10kΩ o reparar pista.',
        measurements: [],
        technicalTips: 'Monitorear la línea INT con osciloscopio: debe pulsar a nivel bajo (0V) cada vez que se toca la pantalla.',
        options: []
      },
      {
        id: 'spt_verdict_touch_ldo_dead',
        title: 'Veredicto: Regulador LDO de Táctil (VDD_TOUCH 1.8V/3.3V) Dañado',
        category: 'verdict',
        description: 'El regulador LDO que alimenta la etapa táctil no emite voltaje. Procedimiento: Sustituir el LDO o puentear desde un riel equivalente siempre que el regulador soporte la corriente demandada.',
        measurements: [],
        technicalTips: 'Verificar previamente que la salida del LDO no tenga cortocircuito a masa.',
        options: []
      },
      {
        id: 'spt_verdict_display_pmic_cpu_dead',
        title: 'Veredicto: Falla Interna en Controlador Display de CPU / PMIC Maestro',
        category: 'verdict',
        description: 'Todas las líneas pasivas y voltajes estáticos miden bien pero la CPU no inicializa el protocolo DSI ni genera el tren de pulsos de imagen. Requiere swap de placa o reballing de procesador principal.',
        measurements: [],
        technicalTips: 'Sin solución de bajo costo viable si el silicio interno de la CPU está dañado.',
        options: []
      },
      {
        id: 'spt_verdict_no_boot',
        title: 'Veredicto: Falla de Encendido Primario (No es Problema de Pantalla)',
        category: 'verdict',
        description: 'El teléfono no bootea ni emite consumo dinámico de encendido. El síntoma de pantalla negra es consecuencia de que la placa lógica no inicia su secuencia de arranque. Derivar a árbol de Falla de Encendido o Consumo en Fuente.',
        measurements: [],
        technicalTips: 'Revisar rieles primarios VDD_MAIN y circuito de carga antes de continuar.',
        options: []
      }
    ]
  },
  {
    id: 'smartphone_power_hold_zero',
    name: 'Smartphone: Consumo en Fuente que Cae a 0 al soltar Power (Sin auto-sostén / Power Hold)',
    deviceType: 'Smartphone (MTK / Qualcomm / Exynos)',
    description: 'Diagnóstico exhaustivo para dispositivos que consumen corriente al pulsar el botón de encendido (ej. 40mA a 200mA) pero caen instantáneamente a 0.000A al soltar el botón. Abarca plataformas Qualcomm y MediaTek, reconocimiento de puertos EDL 9008 / VCOM por USB, medición de bobinas secundarias PMIC (VCORE, VMEM, VIO) y descarte de fisuras BGA vs memoria dañada.',
    nodes: [
      {
        id: 'sph_start',
        title: 'Evaluación del Síntoma de Falta de Auto-Sostén (Power Hold)',
        category: 'symptom',
        description: 'Placa conectada a fuente DC regulada a 4.2V. Al presionar el botón de encendido (PWRKEY), el amperímetro sube a un consumo inicial de 40mA - 180mA, pero al soltar el botón cae inmediatamente a 0.000A. El PMIC no retiene la secuencia de alimentación ni realiza el apretón de manos (handshake) con el procesador.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Consumo sostenido > 150mA y en escalonamiento dinámico al soltar power',
            tolerance: 'Caída instantánea a 0.000A indica falla de Power Hold',
            referenceValues: {
              diodeDrop: '0.400V en botón de encendido / 0.450V en V_BAT',
              nominalVoltage: '1.8V o 4.0V en PWRKEY antes de presionar',
              usbCurrent: '0.00A en reposo'
            }
          }
        ],
        technicalTips: 'El circuito de auto-sostén requiere: 1) Que el PMIC active sus reguladores buck secundarios; 2) Que el oscilador XTAL genere reloj maestro; 3) Que la CPU reciba alimentación y devuelva la señal PS_HOLD (Qualcomm) o WATCHDOG/RESETB (MTK).',
        options: [
          {
            label: 'Plataforma basada en procesador Qualcomm Snapdragon',
            targetNodeId: 'sph_qc_usb_edl_test',
            badgeColor: 'blue'
          },
          {
            label: 'Plataforma basada en procesador MediaTek (MTK / Dimensity)',
            targetNodeId: 'sph_mtk_usb_vcom_test',
            badgeColor: 'yellow'
          },
          {
            label: 'Consumo no cae a cero sino que oscila cíclicamente en bucle (Bootloop de PMIC)',
            targetNodeId: 'sph_buck_coils_diode_test',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sph_qc_usb_edl_test',
        title: 'Qualcomm: Detección de Puerto USB en PC (Modo EDL 9008 Directo)',
        category: 'action',
        description: 'Conectar el dispositivo a una PC mediante cable USB (sin batería o con batería conectada) y abrir el Administrador de Dispositivos de Windows en la sección Puertos (COM y LPT).',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: 'Detección de Qualcomm HS-USB QDLoader 9008',
            tolerance: 'Consumo fijo en amperímetro USB de 30mA a 60mA',
            referenceValues: {
              diodeDrop: '0.600V - 0.700V en líneas USB D+ y D-',
              nominalVoltage: '5.0V VBUS',
              usbCurrent: '0.04A - 0.06A en modo EDL 9008'
            }
          }
        ],
        technicalTips: 'Si una placa Qualcomm entra en EDL 9008 automático (sin forzar testpoint ni cable EDL), significa que el SoC ejecutó con éxito el Primary Bootloader (PBL) en su ROM interna, pero NO pudo comunicarse con la memoria UFS o eMMC.',
        options: [
          {
            label: 'PC detecta inmediatamente Qualcomm HS-USB QDLoader 9008 (EDL directo)',
            targetNodeId: 'sph_qc_edl_mem_analysis',
            badgeColor: 'green'
          },
          {
            label: 'PC no detecta ningún puerto USB o genera Dispositivo USB no reconocido',
            targetNodeId: 'sph_buck_coils_diode_test',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sph_qc_edl_mem_analysis',
        title: 'Qualcomm EDL 9008: Diagnóstico de Memoria UFS / eMMC vs Daño de Soldadura',
        category: 'measurement',
        description: 'El procesador Qualcomm está vivo. La falta de auto-sostén y el ingreso directo a EDL se debe a que el SoC busca el firmware en la memoria de almacenamiento y esta no responde a través de los rieles de datos o alimentación (VCC / VCCQ / VDD_UFS).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VCC_eMMC: 2.8V - 3.3V | VCCQ: 1.8V | VDD_UFS: 1.2V',
            tolerance: '±5% en rieles de memoria',
            referenceValues: {
              diodeDrop: '0.350V - 0.450V en líneas de datos UFS (TX/RX)',
              nominalVoltage: '1.8V VCCQ / 2.8V VCC',
              usbCurrent: '0.05A en puerto EDL'
            }
          }
        ],
        technicalTips: 'Conectar software de servicio (ej. UnlockTool, Chimera o MiFlash) y leer la información de la partición (GPT / Storage Info). Si arroja error Storage Error o timeout de bus, la memoria está dañada o desoldada.',
        options: [
          {
            label: 'Herramienta de flasheo arroja error de lectura de particiones GPT o timeout',
            targetNodeId: 'sph_verdict_storage_dead',
            badgeColor: 'red'
          },
          {
            label: 'Herramienta lee memoria correctamente pero al desconectar USB sigue sin auto-sostén',
            targetNodeId: 'sph_bga_pressure_test',
            badgeColor: 'yellow'
          },
          {
            label: 'Falta alimentación de memoria (VCC 2.8V o VCCQ 1.8V ausente en LDO de PMIC)',
            targetNodeId: 'sph_verdict_pmic_ldo_mem_dead',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sph_mtk_usb_vcom_test',
        title: 'MediaTek: Detección de Puerto USB en PC (Modo VCOM / BROM)',
        category: 'action',
        description: 'Conectar dispositivo a PC sin batería presionando Vol- o directamente por USB. Verificar si el Administrador de Dispositivos genera MediaTek USB Port (VCOM) o MediaTek Preloader.',
        measurements: [
          {
            tool: 'Amperímetro USB',
            expected: 'Generación de puerto COM MediaTek USB Port',
            tolerance: 'Puerto estable o ciclo de desconexión cada 5 segundos',
            referenceValues: {
              diodeDrop: '0.550V - 0.700V en USB D+ / D-',
              nominalVoltage: '5.0V VBUS',
              usbCurrent: '0.05A - 0.10A en modo BROM'
            }
          }
        ],
        technicalTips: 'En MTK, si la BootROM interna del procesador no encuentra el archivo Preloader en la memoria eMMC/UFS, el procesador se queda en bucle de puerto VCOM cada 3 a 5 segundos.',
        options: [
          {
            label: 'PC detecta MediaTek USB Port continuo o cíclico (BROM activo)',
            targetNodeId: 'sph_mtk_mem_check',
            badgeColor: 'green'
          },
          {
            label: 'PC no detecta ningún dispositivo USB en absoluto',
            targetNodeId: 'sph_buck_coils_diode_test',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sph_mtk_mem_check',
        title: 'MediaTek BROM: Evaluación de Comunicación con eMMC / UFS',
        category: 'measurement',
        description: 'Conectar a herramienta de servicio (SP Flash Tool / UnlockTool / Pandora). Ejecutar prueba de lectura de memoria (Read Partition / Health Check).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.350V - 0.500V en CMD, CLK y DAT0 (eMMC) o UFS TX/RX',
            tolerance: '0.000V indica línea en corto / OL indica desprendimiento BGA',
            referenceValues: {
              diodeDrop: '350 - 500 mV en líneas eMMC/UFS',
              nominalVoltage: '1.8V VIO18 / 2.8V VEMC',
              usbCurrent: '0.06A - 0.12A dinámico'
            }
          }
        ],
        technicalTips: 'En procesadores MT6765, MT6768, Dimensity 700/810, los impactos suelen arrancar las pistas de la línea CLK o CMD que viajan debajo de la eMMC.',
        options: [
          {
            label: 'Error de handshake en BROM (STATUS_EXT_RAM_EXCEPTION o HW_STORAGE_FAILURE)',
            targetNodeId: 'sph_verdict_storage_dead',
            badgeColor: 'red'
          },
          {
            label: 'Memoria responde con éxito en herramienta pero al usar batería cae a 0mA',
            targetNodeId: 'sph_bga_pressure_test',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sph_buck_coils_diode_test',
        title: 'Medición en Modo Diodo de Bobinas Secundarias del PMIC (Bucks)',
        category: 'measurement',
        description: 'Con la placa desenergizada, medir en modo diodo con punta roja a GND sobre cada una de las bobinas de potencia alrededor del PMIC principal: VCORE (CPU), VMEM (RAM/Memoria), VIO (1.8V lógico) y reguladores APC.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'VCORE: 0.015V - 0.080V | VMEM: 0.250V - 0.380V | VIO: 0.350V - 0.500V',
            tolerance: '0.000V o < 0.005V indica corto absoluto (diferenciar de baja impedancia normal de núcleo)',
            referenceValues: {
              diodeDrop: 'VCORE: 15 - 80 mV | VMEM: 250 - 380 mV | VIO: 350 - 500 mV',
              nominalVoltage: 'VCORE: 0.75V - 1.10V | VMEM: 1.10V - 1.20V | VIO: 1.80V',
              usbCurrent: '0.00A (Medición en frío)'
            }
          }
        ],
        technicalTips: 'ATENCIÓN TÉCNICA: La bobina de VCORE de CPU tiene naturalmente una impedancia muy baja (15mV a 50mV en modo diodo o 8Ω a 25Ω en resistencia). Esto NO es un cortocircuito. Un cortocircuito real marcará 0.000V y continuidad acústica absoluta (0.0Ω).',
        options: [
          {
            label: 'Corto absoluto (0.000V / 0.1Ω) en bobina de VCORE o VMEM',
            targetNodeId: 'sph_verdict_vcore_short',
            badgeColor: 'red'
          },
          {
            label: 'Todas las bobinas presentan caídas en modo diodo normales',
            targetNodeId: 'sph_pmic_voltages_power_press',
            badgeColor: 'green'
          },
          {
            label: 'Línea VIO (1.8V) en corto pleno a tierra (0.000V)',
            targetNodeId: 'sph_verdict_vio_short',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sph_pmic_voltages_power_press',
        title: 'Medición Dinámica de Salidas de Voltaje en PMIC al Pulsar Power',
        category: 'measurement',
        description: 'Conectar fuente DC a 4.2V y punta de multímetro en voltios sobre las bobinas secundarias mientras se mantiene presionado el botón de encendido. Comprobar si los voltajes se levantan durante el pulso.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VIO (1.8V), VCORE (0.8V - 1.0V) y VMEM (1.2V) presentes mientras se presiona Power',
            tolerance: 'Si no aparece ningún voltaje, el PMIC tiene falla de oscilación o protección interna',
            referenceValues: {
              diodeDrop: 'Valores correctos medidos previamente',
              nominalVoltage: '1.8V / 0.9V / 1.2V durante el pulso',
              usbCurrent: 'Consumo de 80mA a 160mA en fuente'
            }
          }
        ],
        technicalTips: 'Si los voltajes aparecen durante el pulso y caen a 0V al soltar, el PMIC funciona bien pero la CPU no devuelve la señal PS_HOLD (Qualcomm) o PWRHOLD (MTK).',
        options: [
          {
            label: 'Los voltajes aparecen durante el pulso pero caen inmediatamente a 0V al soltar',
            targetNodeId: 'sph_bga_pressure_test',
            badgeColor: 'yellow'
          },
          {
            label: 'Ningún voltaje secundario se genera al presionar Power (0.00V en todas las bobinas)',
            targetNodeId: 'sph_xtal_oscillator_test',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'sph_xtal_oscillator_test',
        title: 'Verificación del Cristal Oscilador Maestro (XTAL 38.4MHz / 26MHz / 32.768kHz)',
        category: 'measurement',
        description: 'Comprobar el cristal de cuarzo asociado al PMIC/CPU. Si el oscilador maestro no resuena, la lógica digital del PMIC no puede avanzar en la máquina de estados de encendido.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Onda senoidal pura de 38.4MHz o 26.0MHz / 32.768kHz con amplitud de 0.8Vpp a 1.2Vpp',
            tolerance: 'Frecuencia estable sin jitter excesivo',
            referenceValues: {
              diodeDrop: '0.550V - 0.700V en bornes de XTAL',
              nominalVoltage: '0.4V - 0.9V DC de polarización en terminales de cristal',
              usbCurrent: '0.02A - 0.04A'
            }
          }
        ],
        technicalTips: 'Los cristales de cuarzo SMD son piezas cerámicas frágiles; un golpe fuerte puede quebrar la lámina interna de cuarzo impidiendo cualquier oscilación.',
        options: [
          {
            label: 'El oscilador XTAL no emite señal de reloj o está quebrado internamente',
            targetNodeId: 'sph_verdict_xtal_replace',
            badgeColor: 'red'
          },
          {
            label: 'Oscilador funciona correctamente (frecuencia estable presente)',
            targetNodeId: 'sph_verdict_pmic_master_fault',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sph_bga_pressure_test',
        title: 'Prueba de Esfuerzo Mecánico / Presión Controlada en BGA de CPU / RAM',
        category: 'action',
        description: 'Aplicar presión física moderada con el pulgar o una pinza con almohadilla de goma directamente sobre el encapsulado BGA de la CPU / memoria RAM mientras se conecta a la fuente y se presiona el botón Power.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Comportamiento del amperímetro bajo presión mecánica',
            tolerance: 'Si la corriente se sostiene en 200mA+ o arranca, confirma fisura BGA',
            referenceValues: {
              diodeDrop: 'N/A (prueba mecánica)',
              nominalVoltage: '4.2V V_BAT',
              usbCurrent: 'Aumento de corriente al ejercer presión'
            }
          }
        ],
        technicalTips: 'En caídas fuertes, las microesferas de soldadura BGA (sacrificiales) entre la CPU y la placa base se fracturan microscópicamente. La presión mecánica restaura temporalmente el contacto de las líneas de control PS_HOLD / bus de memoria.',
        options: [
          {
            label: 'Bajo presión la placa retiene el consumo, bootea o da imagen',
            targetNodeId: 'sph_verdict_cpu_bga_fracture',
            badgeColor: 'green'
          },
          {
            label: 'La placa sigue cayendo a 0mA a pesar de la presión mecánica',
            targetNodeId: 'sph_ps_hold_line_check',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sph_ps_hold_line_check',
        title: 'Medición de Señal de Control PS_HOLD / WATCHDOG / RESET',
        category: 'measurement',
        description: 'Medir en el test point o resistor pull-down de la línea PS_HOLD (Qualcomm) o RSTB / WATCHDOG (MediaTek) que viaja de la CPU al PMIC. Esta señal debe subir a 1.8V en nivel lógico alto para ordenar al PMIC mantener los reguladores encendidos.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.80V constante en señal PS_HOLD durante el intento de boot',
            tolerance: '0.00V permanente indica que la CPU no ordena el sostenimiento de energía',
            referenceValues: {
              diodeDrop: '0.450V - 0.550V en línea de control PS_HOLD',
              nominalVoltage: '1.8V nivel lógico alto',
              usbCurrent: 'Consumo oscilante en fuente'
            }
          }
        ],
        technicalTips: 'Si la línea PS_HOLD mide en modo diodo 0.000V o OL, la pista entre CPU y PMIC está cortada en las capas internas del PCB.',
        options: [
          {
            label: 'Línea PS_HOLD en OL (Pista interna cortada entre CPU y PMIC)',
            targetNodeId: 'sph_verdict_ps_hold_trace_cut',
            badgeColor: 'red'
          },
          {
            label: 'Línea PS_HOLD con diodo normal (500mV) pero CPU nunca genera el pulso de 1.8V',
            targetNodeId: 'sph_verdict_cpu_internal_death',
            badgeColor: 'red'
          },
          {
            label: 'Señal de 1.8V sí llega al PMIC pero este igual apaga los rieles',
            targetNodeId: 'sph_verdict_pmic_master_fault',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'sph_verdict_cpu_bga_fracture',
        title: 'Veredicto: Soldaduras BGA de CPU / Memoria Fracturadas por Impacto',
        category: 'verdict',
        description: 'La prueba de presión mecánica confirmó que la falta de auto-sostén se debe a esferas BGA desoldadas o fracturadas entre el procesador (SoC) y la placa madre debido a una caída. Procedimiento: Desoldar procesador y memoria RAM (temperatura 340°C-350°C), limpieza de resina epóxica (underfill), reballing con estencil dedicado y aleación 183°C plomada, y montaje.',
        measurements: [],
        technicalTips: 'Comprobar bajo microscopio que no existan pistas desprendidas (pads arrancados) en la placa base antes de volver a soldar la CPU.',
        options: []
      },
      {
        id: 'sph_verdict_storage_dead',
        title: 'Veredicto: Memoria UFS / eMMC Dañada o Bloque de Boot Corrupto',
        category: 'verdict',
        description: 'El procesador inicia en modo de rescate BROM / EDL 9008 pero no logra sincronizar con la memoria de almacenamiento flash debido a agotamiento de celdas (Health Report > 90% de desgaste en SLC/MLC) o daño interno en el controlador de la memoria. Procedimiento: Reemplazo de memoria UFS/eMMC con reprogramación de particiones y RPMB limpio.',
        measurements: [],
        technicalTips: 'En dispositivos con procesador emparejado (ej. Qualcomm UFS Cryptographic Binding), se requiere sustituir el combo CPU + Memoria o reprogramar con programadora dedicada (EasyJTAG / Medusa Pro II / MiTester).',
        options: []
      },
      {
        id: 'sph_verdict_vcore_short',
        title: 'Veredicto: Cortocircuito Irrecuperable en Núcleo de CPU (VCORE)',
        category: 'verdict',
        description: 'Medición en modo diodo arrojó 0.000V / 0.0Ω en el riel de alimentación principal de la CPU (VCORE). Se descartaron capacitores de filtrado y el silicio interno del procesador se encuentra perforado por sobretensión. Veredicto: Sin solución técnica viable sin reemplazo integral de placa madre.',
        measurements: [],
        technicalTips: 'Explicar al cliente que el procesador principal sufrió daño eléctrico irreversible.',
        options: []
      },
      {
        id: 'sph_verdict_vio_short',
        title: 'Veredicto: Cortocircuito en Riel Lógico Secundario (VIO / 1.8V)',
        category: 'verdict',
        description: 'El riel de entrada/salida de 1.8V se encuentra en cortocircuito a masa, impidiendo el encendido de los circuitos lógicos del teléfono. Procedimiento: Inyectar 1.8V con 1.5A en el riel VIO y rastrear con cámara térmica el componente disipador de calor (suele ser un capacitor cerámico, sensor o códec de audio).',
        measurements: [],
        technicalTips: 'No exceder 1.8V en la inyección de este riel para evitar dañar las líneas I/O del procesador.',
        options: []
      },
      {
        id: 'sph_verdict_xtal_replace',
        title: 'Veredicto: Oscilador de Cuarzo Principal (XTAL) Roto por Impacto',
        category: 'verdict',
        description: 'El cristal oscilador de 38.4MHz / 26MHz no produce señal de reloj para sincronizar la máquina de estados del PMIC. Procedimiento: Sustituir el cristal oscilador SMD de 4 pines tomado de una placa donante con estación de soldadura a 300°C.',
        measurements: [],
        technicalTips: 'Soldar con cautín y pasta de estaño para no aplicar exceso de calor a la cápsula de cristal hermética.',
        options: []
      },
      {
        id: 'sph_verdict_pmic_master_fault',
        title: 'Veredicto: PMIC Maestro Dañado en Circuito de Enclavamiento / Power Hold',
        category: 'verdict',
        description: 'El circuito integrado de gestión de energía (PMIC principal, ej. PM8953, PM6150, MT6357, MT6358) recibe la orden de encendido y señal de retorno pero sus reguladores internos entran en protección térmica o apagado forzado. Procedimiento: Reemplazar el PMIC principal por uno nuevo garantizado.',
        measurements: [],
        technicalTips: 'Revisar que no queden bolas de estaño unidas debajo del encapsulado BGA tras el montaje.',
        options: []
      },
      {
        id: 'sph_verdict_pmic_ldo_mem_dead',
        title: 'Veredicto: Regulador LDO de Memoria en PMIC Dañado (VCCQ 1.8V / VCC 2.8V)',
        category: 'verdict',
        description: 'El PMIC genera los rieles buck pero el regulador lineal LDO que suministra los voltajes a la memoria UFS/eMMC está inoperativo, dejando a la memoria sin alimentación. Procedimiento: Reemplazo de PMIC o inyección asistida de riel externo.',
        measurements: [],
        technicalTips: 'Comprobar antes que no sea la memoria la que tiene el riel en corto a tierra.',
        options: []
      },
      {
        id: 'sph_verdict_ps_hold_trace_cut',
        title: 'Veredicto: Pista de Señal de Control PS_HOLD Cortada en Capas Internas',
        category: 'verdict',
        description: 'Fisura en las pistas de interconexión intermedias de la placa madre entre el procesador y el PMIC debida a torsión mecánica severa. Procedimiento: Rastrear el punto de prueba (TP) y realizar micro-jumper aislado con máscara UV de curado ultravioleta.',
        measurements: [],
        technicalTips: 'Utilizar alambre de cobre esmaltado 0.02mm y curar con luz UV durante 3 minutos.',
        options: []
      },
      {
        id: 'sph_verdict_cpu_internal_death',
        title: 'Veredicto: Silicio de CPU Inoperativo (Falla Interna de Boot ROM / Señal)',
        category: 'verdict',
        description: 'El procesador recibe todos los rieles buck de energía pero nunca activa la línea de auto-sostén ni genera comunicación por USB. Diagnóstico: Silicio de procesador degradado o quemado internamente. Sin solución técnica viable a costo razonable.',
        measurements: [],
        technicalTips: 'Notificar al cliente la inviabilidad técnica de reparación y recomendar recambio de placa madre.',
        options: []
      }
    ]
  },
  {
    id: 'laptop_motherboard_no_post',
    name: 'Laptop: Secuencia de Rieles de Encendido y No POST',
    deviceType: 'Laptop / Placa Madre PC',
    description: 'Diagnóstico paso a paso de la secuencia de encendido (Power Sequence) desde los 19V/20V de entrada, rieles Always (3.3V / 5V), KBC/EC, transiciones ACPI (S5, S3, S0) hasta CPU VCore y BIOS SPI.',
    nodes: [
      {
        id: 'lap_start',
        title: 'Verificación del Riel Principal DC-IN (19V - 20V / USB-C PD)',
        category: 'symptom',
        description: 'Laptop no responde al botón de encendido. No hay LEDs testigos activos. Conectar adaptador de corriente original o fuente de banco a través del conector DC Jack / puerto USB-C PD.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '19.5V (+/- 0.5V) en DC-IN o 20.0V en USB-C PD',
            tolerance: 'Mínimo 18.5V para fuentes de 19V'
          }
        ],
        technicalTips: 'En laptops con USB-C PD, el chip negociador (CC Controller / TI TPS6598x) debe recibir 5V antes de negociar los 20V con el cargador.',
        options: [
          {
            label: '19V / 20V presentes en el conector de entrada DC Jack',
            targetNodeId: 'lap_first_second_mosfet',
            badgeColor: 'green'
          },
          {
            label: 'El voltaje en el conector cae a 0V y la fuente hace "clic" o parpadea (Corto en entrada)',
            targetNodeId: 'lap_vin_short_check',
            badgeColor: 'red'
          },
          {
            label: 'En USB-C PD se queda clavado en 5V y no sube a 20V',
            targetNodeId: 'lap_pd_controller_test',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'lap_first_second_mosfet',
        title: 'Apertura de los MOSFETs de Entrada (Canal N / P)',
        category: 'measurement',
        description: 'Medir el voltaje en el Drain y Source del primer y segundo MOSFET de entrada, y comprobar el voltaje de Gate (puerta) generado por el circuito integrado de carga (Charger IC - ej: BQ24780).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Para MOSFET Canal N: Gate = 25.0V (mediante bomba de carga); Para Drain = 19.5V',
            tolerance: 'Gate debe ser ~6V más alto que Source para saturar el canal N'
          }
        ],
        technicalTips: 'Si en el primer MOSFET entran 19V pero en su salida hay 0V y el Gate mide 19V en lugar de 25V, el Charger IC no activa la compuerta por detección de sobrecorriente.',
        options: [
          {
            label: '19V pasan exitosamente a la resistencia Shunt principal (Riel B+ / VINT20)',
            targetNodeId: 'lap_always_rails',
            badgeColor: 'green'
          },
          {
            label: 'El voltaje se detiene en el primer MOSFET (Gate en 0V o 19V sin bomba de carga)',
            targetNodeId: 'lap_charger_ic_check',
            badgeColor: 'yellow'
          },
          {
            label: 'Resistencia Shunt mide 0.000V en modo diodo a tierra (Corto en riel B+)',
            targetNodeId: 'lap_bplus_short_injection',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'lap_vin_short_check',
        title: 'Localización de Corto Circuito en Etapa de Entrada DC-IN',
        category: 'measurement',
        description: 'Medir con multímetro en modo diodo / continuidad entre el pin central positivo del DC Jack y tierra.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V - 0.600V a tierra',
            tolerance: '0.000V indica diodo de protección o condensador de filtro perforado'
          }
        ],
        technicalTips: 'Revisar inmediatamente el diodo supresor unidireccional colocado justo a la entrada del conector.',
        options: [
          {
            label: 'Diodo de protección de entrada en cortocircuito directo',
            targetNodeId: 'lap_verdict_input_diode',
            badgeColor: 'green'
          },
          {
            label: 'Condensador cerámico de filtrado previo al primer MOSFET en corto',
            targetNodeId: 'lap_verdict_input_cap',
            badgeColor: 'green'
          }
        ]
      },
      {
        id: 'lap_bplus_short_injection',
        title: 'Inyección de Tensión en Resistencia Shunt Principal (B+)',
        category: 'action',
        description: 'El riel B+ (19V) alimenta todas las etapas BUCK de la placa (CPU, RAM, GPU, 3.3V/5V). Para no quemar el procesador, inyectar SOLO 1.0V con límite de 3A en la resistencia shunt.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Detección de calor en condensador de filtrado o en MOSFET High-Side de alguna fase',
            tolerance: '¡NUNCA superar 1.5V en esta prueba!'
          }
        ],
        technicalTips: '¡PELIGRO TÉCNICO!: Si un MOSFET High-Side de la fase de CPU está perforado y se inyectan 19V, los 19V pasarán directamente al núcleo del procesador destruyéndolo instantáneamente.',
        options: [
          {
            label: 'Calienta un condensador cerámico de filtrado B+ (zona GPU o audio)',
            targetNodeId: 'lap_verdict_bplus_cap',
            badgeColor: 'green'
          },
          {
            label: 'Calienta el MOSFET High-Side de la fase de alimentación de la CPU',
            targetNodeId: 'lap_verdict_vcore_mosfet_short',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'lap_charger_ic_check',
        title: 'Verificación del IC de Carga (Charger IC / BQ / ISL)',
        category: 'measurement',
        description: 'Comprobar las señales básicas del Charger IC: VCC (19V), ACDET (Divisor resistivo ~2.6V) y ACOK (Salida Open-Drain ~3.3V pull-up hacia KBC).',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'VCC = 19.5V, ACDET = 2.4V a 2.7V, ACOK = 3.3V',
            tolerance: 'ACDET debe estar estrictamente dentro del rango para habilitar ACOK'
          }
        ],
        technicalTips: 'Si ACDET está por debajo de 2.4V debido a que una de las dos resistencias del divisor resistivo se desvalorizó, el circuito creerá que el cargador es insuficiente y no habilitará la placa.',
        options: [
          {
            label: 'ACDET desvalorizado (< 2.0V) por resistencia alterada',
            targetNodeId: 'lap_verdict_acdet_resistor',
            badgeColor: 'yellow'
          },
          {
            label: 'Tensiones correctas pero ACOK no sube a 3.3V (Charger IC quemado)',
            targetNodeId: 'lap_verdict_charger_ic_fault',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'lap_always_rails',
        title: 'Verificación de Rieles Always (3.3V y 5.0V ALW)',
        category: 'measurement',
        description: 'Comprobar los convertidores reductores síncronos (bobinas de 3.3V ALW y 5V ALW) que alimentan el controlador embebido (KBC/EC) y lógica básica.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '+3.30V y +5.00V estables en sus respectivas bobinas',
            tolerance: '+/- 0.10V'
          }
        ],
        technicalTips: 'Algunas laptops modernas activan el riel de 5V y 3.3V únicamente después de recibir el comando de encendido (S5->S0), pero el LDO de 3.3V siempre debe estar presente.',
        options: [
          {
            label: '3.3V y 5.0V presentes y estables en las bobinas',
            targetNodeId: 'lap_kbc_ec_test',
            badgeColor: 'green'
          },
          {
            label: 'Riel de 3.3V LDO en 0V o bobina de 3.3V en corto a tierra',
            targetNodeId: 'lap_3v_short_check',
            badgeColor: 'red'
          },
          {
            label: 'PWM de Standby no genera tensiones (LDO presente pero sin pulsos de conmutación)',
            targetNodeId: 'lap_verdict_standby_ic',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'lap_3v_short_check',
        title: 'Rastreo de Corto en Línea de 3.3V Always',
        category: 'action',
        description: 'La línea de 3.3V ALW alimenta directamente el chip KBC/EC, el chip de BIOS SPI, chip de red LAN y el puente sur (PCH/SoC). Inyectar 3.3V a 1.5A.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Localización del componente que absorbe corriente',
            tolerance: 'No superar 3.3V'
          }
        ],
        technicalTips: 'Si el PCH / SoC del procesador integrado se calienta rápidamente, significa que el chipset recibió un pico de tensión y el procesador está destruido.',
        options: [
          {
            label: 'Calienta el chip KBC / EC (ITE / ENE / Nuvoton)',
            targetNodeId: 'lap_verdict_kbc_short',
            badgeColor: 'green'
          },
          {
            label: 'Calienta el chip de Red Ethernet LAN (Realtek)',
            targetNodeId: 'lap_verdict_lan_ic',
            badgeColor: 'green'
          },
          {
            label: 'Calienta el núcleo central del SoC / PCH (Procesador irreparable)',
            targetNodeId: 'lap_verdict_pch_dead',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'lap_kbc_ec_test',
        title: 'Requisitos de Inicio del Controlador Embebido (KBC / EC)',
        category: 'measurement',
        description: 'Comprobar los 5 requisitos básicos del KBC: 1) VCC 3.3V, 2) Señal RESET (EC_RST# = 3.3V), 3) Oscilador RTC de 32.768kHz, 4) Lectura de firmware EC, 5) Señal LID_SW# (sensor tapa cerrada = 3.3V).',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Onda sinusoidal de 32.768 kHz en cristal de cuarzo RTC',
            tolerance: 'Amplitud 0.8V - 1.2V pico a pico'
          },
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'LID_SW# = 3.3V (abierto) / EC_RST# = 3.3V',
            tolerance: 'Si LID_SW# = 0V, la placa cree que la pantalla está cerrada y no enciende'
          }
        ],
        technicalTips: 'El sensor de efecto Hall de la tapa suele sulfatarse por derrames de líquidos, bloqueando el encendido.',
        options: [
          {
            label: 'Todos los requisitos del KBC están OK',
            targetNodeId: 'lap_power_button_trigger',
            badgeColor: 'green'
          },
          {
            label: 'Sensor de tapa LID_SW# en 0.0V permanente',
            targetNodeId: 'lap_verdict_hall_sensor',
            badgeColor: 'yellow'
          },
          {
            label: 'Cristal oscilador de 32.768kHz no oscila (0Hz o DC plano)',
            targetNodeId: 'lap_verdict_rtc_crystal',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'lap_power_button_trigger',
        title: 'Disparo del Botón de Encendido y Petición al Chipset (ACPI S5 -> S3 -> S0)',
        category: 'measurement',
        description: 'Presionar el botón de encendido. La línea ON/OFFBTN# debe caer de 3.3V a 0V y volver a 3.3V. El KBC debe reflejar esto al PCH mediante la señal PM_PWRBTN# y el PCH debe responder liberando PM_SLP_S4# y PM_SLP_S3# a 3.3V.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Pulsos de 3.3V en PM_SLP_S3# y PM_SLP_S4# al presionar botón',
            tolerance: 'Nivel lógico alto 3.3V'
          }
        ],
        technicalTips: 'Si el botón cae a 0V pero el PCH no responde con SLP_S3# a nivel alto, comprobar la pila CMOS (3.0V) y la señal RTCRST# antes de declarar dañado el chipset.',
        options: [
          {
            label: 'El PCH libera PM_SLP_S3# (La placa pasa a estado S0 de encendido)',
            targetNodeId: 'lap_vcore_post_check',
            badgeColor: 'green'
          },
          {
            label: 'El PCH nunca libera SLP_S3# (Se queda estancada en estado S5/reposo)',
            targetNodeId: 'lap_bios_firmware_check',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'lap_bios_firmware_check',
        title: 'Verificación de Comunicación SPI con el Chip BIOS / SPI Flash',
        category: 'measurement',
        description: 'Colocar la sonda del osciloscopio en el Pin 1 (CS# - Chip Select) y Pin 6 (CLK - Clock) del chip de memoria BIOS SPI (Winbond / Macronix) al momento de conectar la energía.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Ráfaga de pulsos de reloj (Clock) a 20MHz-50MHz durante la negociación inicial',
            tolerance: 'Amplitud 3.3V o 1.8V según tecnología de la BIOS'
          }
        ],
        technicalTips: 'Una BIOS con la región Intel ME (Management Engine) corrupta o datos de DMI alterados suele causar que el KBC/PCH rechace la secuencia de boot.',
        options: [
          {
            label: 'Hay ráfaga de pulsos pero el sistema no despierta (Corrupción de Firmware)',
            targetNodeId: 'lap_verdict_bios_corrupt',
            badgeColor: 'green'
          },
          {
            label: 'Línea de Clock en 0V permanente o chip BIOS sin alimentación en Pin 8',
            targetNodeId: 'lap_verdict_bios_hardware_fail',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'lap_vcore_post_check',
        title: 'Alimentación de Núcleo CPU (CPU VCore) y Señal PGOOD',
        category: 'measurement',
        description: 'Comprobar las bobinas del regulador PWM de CPU VCore tras el disparo de encendido.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '0.85V - 1.15V dinámico en CPU VCore',
            tolerance: 'Varía según el estado C-State del CPU'
          },
          {
            tool: 'Osciloscopio',
            expected: 'Señal ALL_SYS_PWRGD = 3.3V y CPU_RESET# = 1.05V',
            tolerance: 'Transición a alto confirma POST exitoso'
          }
        ],
        technicalTips: 'Si CPU VCore sube a 0.9V y se mantiene pero no hay video en pantalla ni actividad en el teclado (Bloq Mayús), comprobar el módulo de memoria RAM.',
        options: [
          {
            label: 'VCore presente y estable pero no da video ni responde teclado',
            targetNodeId: 'lap_ram_dram_test',
            badgeColor: 'yellow'
          },
          {
            label: 'VCore no aparece (0.00V en bobinas de CPU a pesar de que el PWM tiene EN=3.3V)',
            targetNodeId: 'lap_verdict_vcore_ic',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'lap_ram_dram_test',
        title: 'Verificación de Rieles de Memoria RAM (VDDQ y VPP)',
        category: 'measurement',
        description: 'Medir las alimentaciones de los slots de memoria: 1.2V (DDR4) o 1.1V (DDR5) en VDDQ, y 2.5V/1.8V en pin VPP.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.20V (DDR4) / 1.10V (DDR5) en bobina de RAM',
            tolerance: '+/- 0.05V'
          }
        ],
        technicalTips: 'El sulfato en los contactos dorados del slot SODIMM o un banco de memoria defectuoso congela el código POST en 0x55 (Memory Not Installed).',
        options: [
          {
            label: 'Tensiones correctas, LED de Bloq Mayús parpadea en código de RAM',
            targetNodeId: 'lap_verdict_ram_reseat',
            badgeColor: 'green'
          },
          {
            label: 'Línea de alimentación de RAM VDDQ ausente',
            targetNodeId: 'lap_verdict_ram_regulator',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'lap_pd_controller_test',
        title: 'Verificación del Controlador de Negociación USB-C Power Delivery',
        category: 'measurement',
        description: 'Comprobar las líneas CC1 y CC2 del puerto USB-C y la alimentación LDO del chip controlador PD.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Pulsos de negociación BMC a 300kHz en línea CC',
            tolerance: 'Amplitud 1.1V - 1.2V'
          }
        ],
        technicalTips: 'Si el chip PD sufrió una sobretensión por un cargador genérico, no podrá comunicarse con el cargador para solicitar el perfil de 20V.',
        options: [
          {
            label: 'Sin pulsos en líneas CC y chip PD caliente al tacto',
            targetNodeId: 'lap_verdict_pd_chip_dead',
            badgeColor: 'red'
          }
        ]
      },
      // VERDICTS
      {
        id: 'lap_verdict_bios_corrupt',
        title: 'Veredicto: Firmware BIOS / Región Intel ME Corrupta',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Todos los rieles de potencia y señales de hardware son correctos. La secuencia de boot se detiene por corrupción en el firmware de arranque o descriptores SPI.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Ráfaga de inicialización completa restaurada',
            tolerance: 'POST completado con salida de video'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el chip BIOS SPI. Realizar backup de seguridad del dump original. Limpiar la región Intel ME / AMD PSP con herramientas especializadas (ej: ME Cleaner / Flash Image Tool) y reprogramar con dump verificado de fabricante. Resoldar con estaño de buena calidad.',
        options: []
      },
      {
        id: 'lap_verdict_bplus_cap',
        title: 'Veredicto: Condensador Cerámico MLCC de Riel B+ Perforado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Un condensador de filtrado del riel principal de 19V derivó a masa, bloqueando la apertura de los MOSFETs de entrada por disparo de protección OCP.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.480V nominal restaurado en el riel B+ tras retirar el componente dañado',
            tolerance: 'Sin continuidad a masa'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el condensador identificado con la cámara térmica. Reemplazarlo por un condensador cerámico de grado automotriz o para laptops con voltaje nominal mínimo de 25V a 50V.',
        options: []
      },
      {
        id: 'lap_verdict_kbc_short',
        title: 'Veredicto: Chip KBC / Embedded Controller Quemado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El microcontrolador KBC (ITE/ENE) sufrió sobretensión a través del riel de 3.3V Always, provocando corto circuito en sus líneas internas de alimentación.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Riel de 3.3V ALW recupera alta impedancia al desoldar el KBC',
            tolerance: '> 0.350V en modo diodo'
          }
        ],
        technicalTips: 'Procedimiento: Retirar el KBC con estación de aire caliente. Si el chip es programable (ej: IT8586E, ENE KB9012), se debe grabar el firmware del EC mediante programador de teclado SVOD o RT809H.',
        options: []
      },
      {
        id: 'lap_verdict_ram_reseat',
        title: 'Veredicto: Falla de Contacto / Módulo SODIMM RAM Averiado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La placa genera todas las tensiones operativas hasta el riel de CPU VCore pero el procesador no puede inicializar el bus de datos de la memoria RAM.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.20V VDDQ y 2.5V VPP estables',
            tolerance: 'Tensiones nominales presentes'
          }
        ],
        technicalTips: 'Procedimiento: Limpiar los terminales del módulo RAM con alcohol isopropílico y borrador técnico. Probar con un módulo de memoria verificado en un slot alternativo. Si la RAM es integrada (On-Board), se requiere deshabilitarla mediante modificación de resistencias de Strapping (UMA/Memory Disable).',
        options: []
      },
      {
        id: 'lap_verdict_acdet_resistor',
        title: 'Veredicto: Divisor Resistivo de Sensado ACDET Desvalorizado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La resistencia superior o inferior del divisor resistivo que mide el voltaje de entrada hacia el Charger IC se abrió o subió su resistencia óhmica.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '2.60V restaurado en pin ACDET del Charger IC',
            tolerance: '2.40V - 2.75V'
          }
        ],
        technicalTips: 'Reemplazar las resistencias SMD 0402 del divisor resistivo por componentes de precisión de tolerancia 1%.',
        options: []
      },
      {
        id: 'lap_verdict_vcore_mosfet_short',
        title: 'Veredicto Crítico: MOSFET High-Side de CPU en Corto (SoC Destruido)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CRÍTICO: El MOSFET superior de la etapa de potencia reductora del CPU se perforó, enviando 19V directamente al núcleo de silicio del procesador de 1V.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.000V con resistencia de 0.00 Ohms en bobina de CPU',
            tolerance: 'Corto irreversible'
          }
        ],
        technicalTips: 'Placa madre irreparable a nivel de componentes sin cambio completo de procesador BGA. Se recomienda sustitución íntegra de la placa madre.',
        options: []
      },
      {
        id: 'lap_verdict_hall_sensor',
        title: 'Veredicto: Sensor de Tapa de Pantalla (Hall Sensor) Atascado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El sensor magnético LID_SW# permanece en nivel bajo (0V), impidiendo que el KBC autorice el encendido de la máquina.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.3V en línea LID_SW# al separar el imán',
            tolerance: 'Nivel lógico alto'
          }
        ],
        technicalTips: 'Reemplazar el circuito integrado sensor Hall SMD o limpiar la zona de sulfato por humedad.',
        options: []
      },
      {
        id: 'lap_verdict_input_diode',
        title: 'Veredicto: Diodo de Protección contra Inversión de Polaridad Perforado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El diodo supresor de la entrada DC-IN se quemó para proteger la placa ante un cargador inadecuado.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.550V restaurado en conector de entrada',
            tolerance: 'Corto eliminado'
          }
        ],
        technicalTips: 'Reemplazar el diodo Schottky/TVS de entrada por un componente de mínimo 5A y 30V.',
        options: []
      },
      {
        id: 'lap_verdict_input_cap',
        title: 'Veredicto: Condensador de Filtrado de Entrada en Cortocircuito',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Uno de los condensadores cerámicos de entrada previa a los MOSFETs de conmutación derivó a masa.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Línea de entrada recupera resistencia infinita/modo diodo nominal',
            tolerance: '19V estables'
          }
        ],
        technicalTips: 'Desoldar el condensador cerámico SMD dañado y reemplazar por un capacitor de 10uF 25V.',
        options: []
      },
      {
        id: 'lap_verdict_charger_ic_fault',
        title: 'Veredicto: Circuito Integrado de Carga y Gestión de Batería Dañado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El Charger IC no genera la señal ACOK ni la tensión de bomba de carga para excitar la compuerta de los MOSFETs de entrada.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'ACOK = 3.3V y Gate = 25.0V tras reemplazo',
            tolerance: 'Señales habilitadas'
          }
        ],
        technicalTips: 'Sustituir el chip integrado BQ/ISL utilizando soldador de aire caliente con flux sin residuo.',
        options: []
      },
      {
        id: 'lap_verdict_standby_ic',
        title: 'Veredicto: Controlador PWM de Standby (3.3V / 5.0V) Averiado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El IC oscilador de los rieles Always recibe habilitación pero no conmutan sus fases MOSFET internas.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.3V y 5.0V estables en bobinas',
            tolerance: 'Tensiones recuperadas'
          }
        ],
        technicalTips: 'Reemplazar el integrado PWM de standby (ej: TPS51125 / Richtek RT8206) verificando previamente que las bobinas no tengan cortocircuito.',
        options: []
      },
      {
        id: 'lap_verdict_lan_ic',
        title: 'Veredicto: Controlador de Red Ethernet LAN Quemado por Rayo/Sobretensión',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Una sobretensión ingresó por el conector RJ45, perforando el chip de red Gigabit y bloqueando el riel Always de 3.3V.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'El riel de 3.3V ALW se normaliza inmediatamente al retirar el chip LAN',
            tolerance: 'Corto desaparecido'
          }
        ],
        technicalTips: 'Desoldar el chip Realtek RTL8111. La laptop encenderá y funcionará con total normalidad vía WiFi mientras se consigue el reemplazo.',
        options: []
      },
      {
        id: 'lap_verdict_pch_dead',
        title: 'Veredicto Crítico: Puente Sur / PCH Integrado en Silicio Quemado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CRÍTICO: El chipset integrado en el encapsulado del procesador presenta cortocircuito irreversible en su riel de standby.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'SoC disipando alta temperatura a 1V inyectado',
            tolerance: 'Daño interno de silicio'
          }
        ],
        technicalTips: 'Reparación inviable a nivel de componentes; requiere sustitución completa del SoC o cambio de placa madre.',
        options: []
      },
      {
        id: 'lap_verdict_rtc_crystal',
        title: 'Veredicto: Cristal Oscilador RTC de 32.768 kHz Inerte',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El cristal de cuarzo no genera la señal de reloj base para el bloque de tiempo real y lógica de standby del KBC/SoC.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Oscilación senoidal pura de 32.768 kHz restaurada',
            tolerance: 'Reloj activo'
          }
        ],
        technicalTips: 'Sustituir el cristal miniatura cilíndrico o SMD de cuarzo y comprobar los dos condensadores cerámicos de sintonización de 12pF.',
        options: []
      },
      {
        id: 'lap_verdict_bios_hardware_fail',
        title: 'Veredicto: Chip de Memoria Flash SPI Dañado Físicamente',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El chip semiconductor SPI Flash no responde al comando de identificación JEDEC ID desde el programador externo.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Lectura nominal en pines de bus SPI tras colocar chip nuevo',
            tolerance: 'Chip reconocido'
          }
        ],
        technicalTips: 'Reemplazar por una memoria SPI Flash nueva del mismo tamaño (ej: 64Mb / 128Mb) y grabar el dump limpio antes de soldar.',
        options: []
      },
      {
        id: 'lap_verdict_vcore_ic',
        title: 'Veredicto: Controlador PWM de Fases de CPU VCore Dañado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El integrador PWM multífase de CPU recibe alimentación y habilitación PGOOD pero no genera señales PWM para los controladores DrMOS.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '0.95V VCore restaurado en bobinas',
            tolerance: 'PWM operativo'
          }
        ],
        technicalTips: 'Sustituir el chip PWM de CPU (ej: Intersil ISL95855 / NCP81205). Comprobar que ninguna de las fases DrMOS esté en corto.',
        options: []
      },
      {
        id: 'lap_verdict_ram_regulator',
        title: 'Veredicto: Regulador de Tensión de Memoria RAM Quemado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El integrado convertidor buck de alimentación de memoria DDR4/DDR5 no produce el riel de 1.2V.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '1.20V presente en bobina de RAM',
            tolerance: '+/- 0.05V'
          }
        ],
        technicalTips: 'Sustituir el regulador buck síncrono dedicado de RAM (ej: TPS51216 / RT8207) y verificar condensadores de salida.',
        options: []
      },
      {
        id: 'lap_verdict_pd_chip_dead',
        title: 'Veredicto: Controlador USB-C Power Delivery Averiado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado de gestión de puerto USB-C PD no efectúa la negociación de 20V quedando estancado en 5V.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Negociación exitosa a 20V / 3A al conectar el cargador',
            tolerance: 'Protocolo PD activo'
          }
        ],
        technicalTips: 'Reemplazar el chip controlador USB-C PD (ej: Texas Instruments TPS65987 o Cypress CCG4) y programar su ROM si corresponde.',
        options: []
      }
    ]
  },
  {
    id: 'console_ps5_hdmi_power',
    name: 'Consola de Videojuegos (PS5 / XSX): Sin Señal HDMI, Luz Blanca / Apagado Inmediato',
    deviceType: 'Consola de Videojuegos (PlayStation 5 / Xbox Series X)',
    description: 'Diagnóstico a nivel de componentes para consolas de última generación: fallas de salida de video HDMI (White Light of Death / WLOD), etapa retimer/encoder, cortocircuito en riel de 12V y fugas de metal líquido en APU.',
    nodes: [
      {
        id: 'con_start',
        title: 'Identificación del Síntoma Primario de la Consola',
        category: 'symptom',
        description: 'La consola se conecta a la red eléctrica y se presiona el botón de encendido. Evaluar el estado del indicador LED frontal y la salida al televisor.',
        measurements: [
          {
            tool: 'Fuente de alimentación',
            expected: 'Consumo en standby ~0.02A / En encendido sube a 1.2A - 2.5A a 12V',
            tolerance: 'Standby < 0.5W'
          }
        ],
        technicalTips: 'En PS5, una luz azul constante que pasa a luz blanca (WLOD) significa que la consola completó el arranque del sistema operativo; si no da imagen, la falla está estrictamente en la etapa de HDMI.',
        options: [
          {
            label: 'Luz azul pasa a Luz Blanca (WLOD) pero televisor indica "Sin Señal"',
            targetNodeId: 'con_hdmi_diode_check',
            badgeColor: 'blue'
          },
          {
            label: 'Emite 1 pitido, el ventilador gira 1 segundo y se apaga de inmediato (Apagado por protección)',
            targetNodeId: 'con_12v_short_check',
            badgeColor: 'red'
          },
          {
            label: 'Luz azul pulsante infinita (BLOD / Blue Light of Death - No pasa a blanco)',
            targetNodeId: 'con_liquid_metal_inspection',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'con_hdmi_diode_check',
        title: 'Medición en Modo Diodo en los Pines del Conector HDMI',
        category: 'measurement',
        description: 'Punta roja a tierra del chasis y punta negra en cada uno de los pines del puerto HDMI: 4 pares diferenciales de alta velocidad (Data 0, 1, 2 y Clock / FRL0 a FRL3), Pin 18 (+5V), Pin 19 (Hot Plug Detect - HPD) y pines DDC (SCL/SDA).',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.450V a 0.650V idéntico en las 8 líneas de pares diferenciales; 0.700V en HPD',
            tolerance: 'Variación máxima de 0.020V entre pares gemelos'
          },
          {
            tool: 'Multímetro (Voltaje)',
            expected: '+5.0V en Pin 18 con la consola encendida',
            tolerance: '4.85V - 5.15V'
          }
        ],
        technicalTips: 'Si alguno de los pines de pares de datos mide 0.000V o circuito abierto (OL / infinito), se debe inspeccionar el filtro EMI y las protecciones ESD antes de retirar el chip retimer.',
        options: [
          {
            label: 'Pines del puerto físicamente doblados o hundidos hacia adentro',
            targetNodeId: 'con_verdict_hdmi_port',
            badgeColor: 'green'
          },
          {
            label: 'Una o más líneas de datos en corto a tierra (0.000V en diodo)',
            targetNodeId: 'con_esd_filter_check',
            badgeColor: 'red'
          },
          {
            label: 'Puerto y filtros miden normales pero no hay señal (+5V y HPD correctos)',
            targetNodeId: 'con_retimer_ic_check',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'con_esd_filter_check',
        title: 'Comprobación de Filtros Choke EMI y Diodos ESD',
        category: 'inspection',
        description: 'Revisar con microscopio los 4 pequeños inductores de modo común (chokes) y los arreglos de diodos ESD ubicados en la cara posterior del puerto HDMI.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Continuidad de 0.001V de extremo a extremo de cada bobina choke',
            tolerance: '< 1 Ohm'
          }
        ],
        technicalTips: 'Conectar un cable HDMI de forma brusca con electricidad estática suele perforar los diodos de protección ESD derivando la línea de datos a masa.',
        options: [
          {
            label: 'Arreglo de diodos ESD en corto (El corto desaparece al retirarlo)',
            targetNodeId: 'con_verdict_esd_replace',
            badgeColor: 'green'
          },
          {
            label: 'Filtro Choke EMI fisurado o abierto',
            targetNodeId: 'con_verdict_choke_replace',
            badgeColor: 'green'
          },
          {
            label: 'El corto se transmite directamente hacia las bolas del chip Retimer HDMI',
            targetNodeId: 'con_verdict_retimer_ic',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'con_retimer_ic_check',
        title: 'Alimentación y Oscilación del Chip Retimer HDMI (Panasonic MN864739)',
        category: 'measurement',
        description: 'Medir los rieles de alimentación del transmisor retimer HDMI: 3.3V y 1.8V en los condensadores de desacoplo circundantes, y oscilador de 27MHz.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.3V y 1.8V presentes y estables',
            tolerance: '+/- 0.05V'
          },
          {
            tool: 'Osciloscopio',
            expected: 'Señal de reloj a 27.0 MHz en cristal de referencia',
            tolerance: 'Frecuencia exacta'
          }
        ],
        technicalTips: 'El chip Panasonic de la PS5 es sumamente propenso a quemarse por tormentas eléctricas o sobretensiones transmitidas a través del cable HDMI del televisor.',
        options: [
          {
            label: 'Alimentaciones presentes pero sin salida de señal digital TMDS / FRL',
            targetNodeId: 'con_verdict_retimer_ic',
            badgeColor: 'green'
          },
          {
            label: 'Falta alimentación de 3.3V o 1.8V por regulador LDO dañado',
            targetNodeId: 'con_verdict_hdmi_ldo',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'con_12v_short_check',
        title: 'Prueba de Continuidad en Riel Principal de Potencia de 12V',
        category: 'measurement',
        description: 'Colocar el multímetro en modo de continuidad entre las dos paletas metálicas principales de entrada de 12V provenientes de la fuente interna.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: '0.400V - 0.550V en polaridad directa',
            tolerance: '0.000V o pitido continuo confirma cortocircuito absoluto a masa'
          }
        ],
        technicalTips: 'Si el riel de 12V está en corto, la fuente de alimentación interna se autoprotege en milisegundos cortando la entrega de corriente.',
        options: [
          {
            label: 'Cortocircuito total a tierra (0.000V / continuidad) en riel de 12V',
            targetNodeId: 'con_12v_injection',
            badgeColor: 'red'
          },
          {
            label: 'Riel de 12V no está en corto; la consola se apaga por comunicación Southbridge',
            targetNodeId: 'con_southbridge_uart',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'con_12v_injection',
        title: 'Inyección de Corriente Controlada en Riel de 12V',
        category: 'action',
        description: 'Inyectar 1.5V a 3A inicialmente con la fuente DC de banco y observar con la cámara térmica la placa principal.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Punto caliente localizado en milisegundos',
            tolerance: 'Temperatura elevada > 60°C'
          }
        ],
        technicalTips: 'Los condensadores cerámicos de 12V situados alrededor de las etapas DrMOS del APU o del circuito de alimentación de la unidad de disco suelen perforarse.',
        options: [
          {
            label: 'Condensador cerámico SMD de 12V en ebullición térmica',
            targetNodeId: 'con_verdict_12v_cap',
            badgeColor: 'green'
          },
          {
            label: 'Circuito integrado DrMOS / Mosfet de fase de alimentación de APU en corto',
            targetNodeId: 'con_verdict_drmos_short',
            badgeColor: 'red'
          }
        ]
      },
      {
        id: 'con_liquid_metal_inspection',
        title: 'Inspección de Desborde de Metal Líquido en APU',
        category: 'inspection',
        description: 'Retirar el disipador térmico con extrema precaución. Inspeccionar la barrera de espuma aislante perimetral del procesador APU.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Distribución térmica regular en todos los bancos GDDR6 y núcleos de silicio',
            tolerance: 'Sin zonas secas oxidadas'
          }
        ],
        technicalTips: 'En consolas PS5 mantenidas en posición vertical, el metal líquido (Galio-Indio-Estaño) puede escurrir por gravedad, creando una zona seca de sobrecalentamiento extremo o provocando cortocircuitos sobre los condensadores SMD del interposer.',
        options: [
          {
            label: 'Metal líquido desbordado sobre condensadores SMD del die del APU',
            targetNodeId: 'con_verdict_liquid_metal_cleanup',
            badgeColor: 'yellow'
          },
          {
            label: 'Zona seca oxidada con sobrecalentamiento instantáneo en el silicio',
            targetNodeId: 'con_verdict_liquid_metal_respread',
            badgeColor: 'green'
          },
          {
            label: 'Metal líquido en buen estado; fallo apunta a memoria GDDR6 desoldada',
            targetNodeId: 'con_southbridge_uart',
            badgeColor: 'yellow'
          }
        ]
      },
      {
        id: 'con_southbridge_uart',
        title: 'Lectura de Códigos de Error por Puerto UART del Southbridge',
        category: 'measurement',
        description: 'Soldar cable de datos TX/RX a los puntos de prueba del Southbridge (CXD90061GG) y conectar a interfaz USB-TTL a 115200 baudios para leer los códigos de diagnóstico (Error Codes).',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Transmisión de tramas ASCII de diagnóstico UART',
            tolerance: 'Nivel TTL 3.3V'
          }
        ],
        technicalTips: 'El log de errores de UART proporciona el código hexadecimal exacto (ej: 80870003 = fallo de comunicación con memoria GDDR6, 80810001 = fallo de alimentación de APU).',
        options: [
          {
            label: 'Código UART indica fallo en banco de memoria RAM GDDR6',
            targetNodeId: 'con_verdict_gddr6_reball',
            badgeColor: 'yellow'
          },
          {
            label: 'Código UART indica falla interna del chip Southbridge',
            targetNodeId: 'con_verdict_southbridge_swap',
            badgeColor: 'red'
          }
        ]
      },
      // VERDICTS
      {
        id: 'con_verdict_hdmi_port',
        title: 'Veredicto: Reemplazo Físico de Puerto HDMI Hembra',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Daño mecánico severo en el receptáculo HDMI. Los pines internos sufrieron deformación y cortocircuitos entre sí al intentar forzar el cable.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Todas las líneas de datos y reloj balanceadas a ~0.550V con puerto nuevo instalado',
            tolerance: 'Continuidad perfecta en las 19 pistas'
          }
        ],
        technicalTips: 'Procedimiento: Desoldar el conector con aire caliente a 420°C desde la cara inferior de la placa o mediante aleación de bajo punto de fusión (aleación Rose/Wood). Limpiar los orificios pasantes pasantes con malla y soldador de cuchilla. Instalar puerto HDMI original de acero reforzado soldando cada uno de los 19 pines con estaño 63/37 y abundante flux.',
        options: []
      },
      {
        id: 'con_verdict_retimer_ic',
        title: 'Veredicto: Transmisor / Retimer Encoder HDMI Quemado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado Retimer (Panasonic MN864739 en PS5 / Texas Instruments en XSX) sufrió descarga electrostática y no regenera las señales de video FRL/TMDS.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Valores equilibrados en pines de entrada y salida',
            tolerance: 'Consumo de imagen restablecido en 4K 120Hz HDR'
          }
        ],
        technicalTips: 'Procedimiento: Extraer el IC QFN/BGA a 380°C. Aplicar stencil de reballing o instalar IC nuevo pre-estañado. Soldar alineando perfectamente las marcas de posicionamiento óptico.',
        options: []
      },
      {
        id: 'con_verdict_12v_cap',
        title: 'Veredicto: Condensador Cerámico MLCC de Riel 12V en Cortocircuito',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Un condensador cerámico de 10uF 25V colocado en el riel de 12V sufrió colapso dieléctrico, disparando la protección de la fuente.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Riel de 12V recupera > 0.400V en diodo tras retirar el capacitor defectuoso',
            tolerance: 'Corto eliminado por completo'
          }
        ],
        technicalTips: 'Reemplazar con un condensador cerámico de alta frecuencia (X7R) con voltaje nominal mínimo de 25V o 35V para mayor margen de seguridad térmica.',
        options: []
      },
      {
        id: 'con_verdict_drmos_short',
        title: 'Veredicto: Etapa de Potencia Integrada DrMOS en Cortocircuito',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Un circuito integrado de etapa de potencia (DrMOS / Smart Power Stage) del regulador de fases del procesador APU se fundió internamente.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Impedancia nominal de la fase de alimentación restablecida',
            tolerance: 'Sin continuidad entre 12V y salida de fase'
          }
        ],
        technicalTips: 'Desoldar el DrMOS dañado (ej: Monolithic Power Systems MPS). Comprobar que la pista de salida hacia el APU no haya sufrido derivación a 12V antes de sustituir el componente.',
        options: []
      },
      {
        id: 'con_verdict_liquid_metal_cleanup',
        title: 'Veredicto: Limpieza de Metal Líquido y Restauración de Dieléctrico',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El metal líquido escurrió sobre los condensadores SMD del encapsulado del APU provocando un puente conductivo que inhibía el encendido.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Valores nominales de condensadores perimetrales recuperados',
            tolerance: 'Sin residuos conductivos'
          }
        ],
        technicalTips: 'Procedimiento: Aspirar cuidadosamente el exceso de metal líquido con jeringa de succión técnica. Limpiar los terminales con hisopos antiestáticos empapados en alcohol isopropílico. Aplicar laca protectora conformada (conformal coating) aislante sobre los condensadores SMD antes de recolocar el metal líquido.',
        options: []
      },
      {
        id: 'con_verdict_liquid_metal_respread',
        title: 'Veredicto: Desecación Térmica de Metal Líquido (Hotspot Re-spread)',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: La superficie de cobre niquelado del disipador reaccionó químicamente con el galio, creando un punto seco oxidado que provocaba corte por sobretemperatura térmica inmediata.',
        measurements: [
          {
            tool: 'Cámara Térmica',
            expected: 'Transferencia térmica homogénea a < 65°C a plena carga gráfica',
            tolerance: 'Disipación continua'
          }
        ],
        technicalTips: 'Pulir suavemente la mancha oxidada del disipador con lana de acero fina o pulimento de metales. Desengrasar con alcohol isopropílico y reaplicar 0.2g de metal líquido homogéneo utilizando pincel aplicador.',
        options: []
      },
      {
        id: 'con_verdict_esd_replace',
        title: 'Veredicto: Arreglo de Diodos ESD Perforado por Descarga Eléctrica',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El chip de supresión ESD derivó una descarga estática del cable HDMI a tierra, protegiendo el chip retimer y el procesador.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Línea de datos restablecida a 0.550V al retirar el array ESD',
            tolerance: 'Tolerancia nominal'
          }
        ],
        technicalTips: 'Soldar un nuevo circuito de protección ESD de ultra-baja capacitancia (< 0.3pF) específico para puertos HDMI 2.1.',
        options: []
      },
      {
        id: 'con_verdict_choke_replace',
        title: 'Veredicto: Bobina Choke EMI de Modo Común Abierta',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Uno de los devanados del inductor de modo común de las líneas de alta velocidad HDMI se abrió por impacto o sobrecorriente.',
        measurements: [
          {
            tool: 'Multímetro (Diodo)',
            expected: 'Continuidad de 0 Ohms entre entrada y salida del choke',
            tolerance: 'Señal pasa al conector'
          }
        ],
        technicalTips: 'Reemplazar el filtro choke miniatura SMD de 90 Ohms @ 100MHz para preservar la integridad de la señal de 48 Gbps de HDMI 2.1.',
        options: []
      },
      {
        id: 'con_verdict_hdmi_ldo',
        title: 'Veredicto: Regulador LDO de 3.3V/1.8V de Etapa HDMI Quemado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El circuito integrado regulador lineal que suministra la tensión de reposo al chip retimer HDMI está inactivo.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: '3.3V y 1.8V estables en la entrada del retimer',
            tolerance: 'Tensiones activas'
          }
        ],
        technicalTips: 'Reemplazar el regulador SOT-23 / QFN de 5 pines por un componente equivalente de 500mA de salida.',
        options: []
      },
      {
        id: 'con_verdict_gddr6_reball',
        title: 'Veredicto: Desoldadura de Esferas BGA en Módulo de Memoria GDDR6',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: Las tensiones térmicas provocaron fractura en las bolas de estaño sin plomo debajo de uno de los 8 chips de memoria gráfica GDDR6.',
        measurements: [
          {
            tool: 'Osciloscopio',
            expected: 'Líneas de datos de memoria sin errores de paridad',
            tolerance: 'Código UART pasa a estado normal'
          }
        ],
        technicalTips: 'Identificar el chip específico a través del log UART. Extraer con calor a 370°C, limpiar pads y realizar reballing con esferas Sn63/Pb37 de 0.45mm y plantilla stencil para GDDR6.',
        options: []
      },
      {
        id: 'con_verdict_southbridge_swap',
        title: 'Veredicto: Circuito Integrado Southbridge (CXD90061GG) Averiado',
        category: 'verdict',
        description: 'DIAGNÓSTICO CONFIRMADO: El controlador de periféricos Southbridge presenta daño interno en su lógica de almacenamiento NVMe / bus PCIe.',
        measurements: [
          {
            tool: 'Multímetro (Voltaje)',
            expected: 'Rieles de 1.1V y 1.8V del Southbridge presentes',
            tolerance: 'Sin respuesta del bus PCIe'
          }
        ],
        technicalTips: 'Sustituir el chip BGA Southbridge mediante estación de retrabajo BGA por infrarrojos o aire caliente con perfil térmico programado.',
        options: []
      }
    ]
  }
];

window.DiagApp = window.DiagApp || {};
window.DiagApp.PRESET_TREES = PRESET_TREES;

