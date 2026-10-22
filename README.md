# Hardware Diagnostic Decision Matrix & Flow Engine ⚡

**Hardware Diagnostic Decision Matrix & Flow Engine** es una plataforma web profesional de ingeniería diagnóstica y visualización nodal para microelectrónica y reparación de hardware a nivel de componentes (placas lógicas de smartphones, sub-placas USB-C, laptops, PCs y consolas de videojuegos).

---

## 🎯 Capacidades Principales

1. **Ejecución Directa `file://` (Sin Bloqueo CORS)**:
   - Arquitectura modular en `js/` cargada de forma secuencial y expuesta en el espacio de nombres `window.DiagApp`, permitiendo abrir `index.html` con **doble clic directo desde Windows** sin necesidad de Live Server ni servidores locales.

2. **Persistencia Automática y Recuperación de Sesión (`localStorage`)**:
   - Guardado automático en tiempo real del árbol seleccionado, paso activo, historial completo de decisiones y bitácora de notas/mediciones.
   - Al volver a abrir o recargar el navegador a mitad de un diagnóstico, despliega un modal interactivo preguntando si se desea **retomar exactamente en el paso donde quedó** o iniciar un diagnóstico nuevo.

3. **Simulador de Diagnóstico Interactivo (Runner)**:
   - Recorrido paso a paso guiado con navegación por migas de pan (*breadcrumbs*), función de retroceso (*backtrack*) y **Bitácora de Banco & Notas del Caso** integrada.
   - Especificaciones de prueba con lecturas nominales esperadas, valores de referencia de taller (Modo Diodo, Voltaje y Amperímetro USB) y tolerancias.
   - Consejos técnicos (*technical tips*) de seguridad, microsoldadura y temperaturas de banco.
   - Opciones de ramificación con codificación de colores visual (`red`, `green`, `yellow`, `blue`) y atajos de teclado (`1`, `2`, `3`...).

4. **Motor Nodal Interactivo en SVG Nativo (Flow Engine)**:
   - Algoritmo de distribución jerárquica DAG para disposición automática sin colisiones ni solapamientos.
   - Conexiones dinámicas con curvas Bézier cúbicas e insignias en cada decisión.
   - Trazado de ruta activa (*neon flow trace*): la trayectoria recorrida se ilumina con animación de flujo en tiempo real.
   - Paneo y zoom continuos (arrastre con mouse/touch, rueda de zoom, botones de ajuste a pantalla y centrado en nodo activo).

5. **Generador de Reporte Técnico y Exportación Directa (`#btn-open-report`)**:
   - Campos editables y persistentes para **Cliente**, **Modelo del Equipo**, **Tensión / Consumo Medido** y **Observaciones**.
   - **Enviar por WhatsApp**: formatea automáticamente todo el recorrido del árbol de decisiones, mediciones y diagnóstico final para WhatsApp Web.
   - **Copiar fila para Planilla (TSV)**: copia al portapapeles una única línea separada por tabulaciones (`Fecha \t Modelo \t Síntoma Inicial \t Diagnóstico Final \t Observaciones`) lista para pegar directo en **Excel** o **Google Sheets**.
   - Impresión directa a PDF (`window.print()`) y copia en Markdown.

---

## 🔬 Protocolos Técnicos de Taller Incluidos

1. **Celular No Enciende (Diagnóstico con Fuente de Laboratorio)**:
   - Consumos iniciales antes de presionar Power (corto directo en `VBAT` vs `VPH_PWR`/`VDD_MAIN`, localización con rosin/cámara térmica y fugas pasivas), consumos fijos tras presionar Power (falla en PMIC, cristal oscilador `XTAL` o bloqueo en protocolo `I2C`) y caídas a cero al soltar Power.
2. **Falla de Carga USB-C / Pin de Carga**:
   - Diferenciación entre tester USB sin consumo (`0.00A` / corto en `VBUS` / pines `CC1`-`CC2` / `OVP IC`), consumo lento fijo (`~0.40A` por líneas de datos `D+`/`D-` abiertas, diodos ESD en fuga o falla de conmutación `C_BOOT`/`LX` en `IF PMIC`) y reinicio en logo / alerta térmica (termistor `NTC` / `BATT_ID`).
3. **PC / Consola Enciende sin Dar Video**:
   - Descarte de fuente de alimentación (`PSU`), cortocircuitos en líneas secundarias de `12V`, `5V` y `3.3V` (VRM MOSFET/DrMOS vs periféricos), diagnóstico de memoria `RAM` (`VDDQ`, `VPP`, `SPD` y módulos), etapa de salida `HDMI`/`Retimer IC` y corte por sobrecalentamiento (pasta térmica / Metal Líquido).
4. **Protocolos Especializados Adicionales**:
   - *Smartphone: Fallas de Pantalla, Imagen y Táctil (OLED Bias VSP/VSN, Backlight Boost y MIPI DSI)*.
   - *Smartphone: Consumo que Cae a 0 al soltar Power (Qualcomm EDL 9008 / MediaTek BROM)*.
   - *Laptop: Secuencia de Rieles de Encendido (19V, KBC/EC, ACPI S5->S0 y BIOS SPI)*.
   - *Consola PS5 / Xbox Series X: Diagnóstico Profundo HDMI, Riel 12V, Metal Líquido y UART*.

---

## 🚀 Cómo Ejecutar el Proyecto

Podés abrir **`index.html` directamente con doble clic** desde el Explorador de Archivos de Windows (`file://`), o bien servirlo desde cualquier servidor estático local.
