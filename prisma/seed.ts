import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import {
  TenantStatus,
  ProductStatus,
} from '../src/common/enums/commerce.enums';

function normalizeBrand(input: string) {
  const key = input.trim().toLowerCase();
  const map: Record<string, string> = {
    logitech: 'Logitech',
    razer: 'Razer',
    steelseries: 'SteelSeries',
    corsair: 'Corsair',
    hyperx: 'HyperX',
    lg: 'LG',
    msi: 'MSI',
    intel: 'Intel',
    amd: 'AMD',
    nvidia: 'NVIDIA',
    samsung: 'Samsung',
    secretlab: 'Secretlab',
    'g.skill': 'G.Skill',
    gskill: 'G.Skill',
  };
  return map[key] ?? input.trim();
}

async function main() {
  console.log('🌱 Seeding gamer store...');

  // ── 1. TENANT ─────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'gamer-store' },
    update: {},
    create: {
      name: 'GamerStore',
      slug: 'gamer-store',
      status: TenantStatus.ACTIVE,
      defaultCurrency: 'COP',
      settings: {},
      orderNumberPrefix: 'GS-',
      orderNumberPadding: 6,
    },
  });

  console.log(`✅ Tenant: ${tenant.name}`);

  // ── 2. CATEGORIES ────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Periféricos', slug: 'perifericos' },
    { name: 'Mouse', slug: 'mouse' },
    { name: 'Teclados', slug: 'teclados' },
    { name: 'Diademas / Headsets', slug: 'diademas-headsets' },
    { name: 'Monitores', slug: 'monitores' },
    { name: 'Procesadores (CPU)', slug: 'procesadores-cpu' },
    { name: 'Memoria RAM', slug: 'memoria-ram' },
    { name: 'Tarjetas Gráficas (GPU)', slug: 'tarjetas-graficas-gpu' },
    { name: 'Almacenamiento', slug: 'almacenamiento' },
    { name: 'Sillas Gamer', slug: 'sillas-gamer' },
  ];

  const categories: Record<string, number> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: cat.slug } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: cat.name,
        slug: cat.slug,
        sortOrder: 0,
      },
    });
    categories[cat.slug] = c.id;
  }

  console.log(`✅ Categories: ${Object.keys(categories).length}`);

  type ProductSeed = {
    name: string;
    slug: string;
    brand: string;
    description: string;
    primarySlug: string;
    categories: string[];
    variants: {
      sku: string;
      name: string;
      attributes: Record<string, string>;
      basePrice: bigint;
      compareAt?: bigint;
      stock: number;
    }[];
  };

  // ── 3. PRODUCTS ──────────────────────────────────────────────────────────
  const products: ProductSeed[] = [
    // ------ MOUSE ------
    {
      name: 'Logitech G502 X Plus',
      slug: 'logitech-g502-x-plus',
      brand: 'Logitech',
      description:
        'Mouse gaming inalámbrico LIGHTFORCE con sensor HERO 25K, 25,600 DPI, RGB LIGHTSYNC y autonomía de hasta 130 horas. Ergonómico para diestros con 13 botones programables.',
      primarySlug: 'mouse',
      categories: ['mouse', 'perifericos'],
      variants: [
        {
          sku: 'LG-G502X-WHT',
          name: 'Blanco',
          attributes: { marca: 'Logitech', color: 'Blanco', conectividad: 'Inalámbrico' },
          basePrice: BigInt(42900_00),
          compareAt: BigInt(49900_00),
          stock: 15,
        },
        {
          sku: 'LG-G502X-BLK',
          name: 'Negro',
          attributes: { marca: 'Logitech', color: 'Negro', conectividad: 'Inalámbrico' },
          basePrice: BigInt(42900_00),
          stock: 22,
        },
      ],
    },
    {
      name: 'Razer DeathAdder V3 Pro',
      slug: 'razer-deathadder-v3-pro',
      brand: 'Razer',
      description:
        'Mouse gaming inalámbrico ultraliviano de 63g con sensor Focus Pro 30K, 30,000 DPI, 90 horas de batería y switches ópticos Razer de 2.ª gen.',
      primarySlug: 'mouse',
      categories: ['mouse', 'perifericos'],
      variants: [
        {
          sku: 'RZ-DAV3P-BLK',
          name: 'Negro',
          attributes: { marca: 'Razer', color: 'Negro', peso: '63g', sensor: 'Focus Pro 30K' },
          basePrice: BigInt(52900_00),
          stock: 10,
        },
        {
          sku: 'RZ-DAV3P-WHT',
          name: 'Blanco',
          attributes: { marca: 'Razer', color: 'Blanco', peso: '63g', sensor: 'Focus Pro 30K' },
          basePrice: BigInt(52900_00),
          stock: 8,
        },
      ],
    },
    {
      name: 'SteelSeries Aerox 9 Wireless',
      slug: 'steelseries-aerox-9-wireless',
      brand: 'SteelSeries',
      description:
        'Mouse MMO/Battle Royale con 18 botones, sensor TrueMove Air 18K, diseño honeycomb ultraligero (89g) y hasta 180 horas de batería. Wi-Fi 2,4 GHz + Bluetooth.',
      primarySlug: 'mouse',
      categories: ['mouse', 'perifericos'],
      variants: [
        {
          sku: 'SS-AX9W-BLK',
          name: 'Negro',
          attributes: {
            marca: 'SteelSeries',
            color: 'Negro',
            botones: '18',
            conectividad: 'Inalámbrico / BT',
          },
          basePrice: BigInt(38900_00),
          compareAt: BigInt(44000_00),
          stock: 12,
        },
      ],
    },

    // ------ TECLADOS ------
    {
      name: 'Corsair K100 RGB',
      slug: 'corsair-k100-rgb',
      brand: 'Corsair',
      description:
        'Teclado mecánico gaming premium con switches OPX óptico-mecánicos de 1mm de actuación, rueda de control OPX, 4.000 macros e iluminación RGB por tecla.',
      primarySlug: 'teclados',
      categories: ['teclados', 'perifericos'],
      variants: [
        {
          sku: 'CS-K100-OPX',
          name: 'OPX - Layout US',
          attributes: {
            marca: 'Corsair',
            switch: 'OPX Óptico',
            layout: 'US',
            retroiluminación: 'RGB',
          },
          basePrice: BigInt(79900_00),
          compareAt: BigInt(92000_00),
          stock: 7,
        },
      ],
    },
    {
      name: 'Logitech G Pro X TKL',
      slug: 'logitech-g-pro-x-tkl',
      brand: 'Logitech',
      description:
        'Teclado TKL para esports con switches GX intercambiables en caliente, cuerpo de aluminio, iluminación LIGHTSYNC RGB y diseño compacto sin teclado numérico.',
      primarySlug: 'teclados',
      categories: ['teclados', 'perifericos'],
      variants: [
        {
          sku: 'LG-GPXTK-RED',
          name: 'GX Red Lineal',
          attributes: { marca: 'Logitech', switch: 'GX Red', tipo: 'Lineal', formato: 'TKL' },
          basePrice: BigInt(58900_00),
          stock: 14,
        },
        {
          sku: 'LG-GPXTK-BLU',
          name: 'GX Blue Clicky',
          attributes: { marca: 'Logitech', switch: 'GX Blue', tipo: 'Clicky', formato: 'TKL' },
          basePrice: BigInt(58900_00),
          stock: 9,
        },
      ],
    },
    {
      name: 'HyperX Alloy Origins 65',
      slug: 'hyperx-alloy-origins-65',
      brand: 'HyperX',
      description:
        'Teclado compacto 65% con switches mecánicos HyperX Aqua, cuerpo de aluminio, USB-C extraíble y RGB por tecla con 5 perfiles onboard.',
      primarySlug: 'teclados',
      categories: ['teclados', 'perifericos'],
      variants: [
        {
          sku: 'HX-AO65-AQUA',
          name: 'HyperX Aqua',
          attributes: {
            marca: 'HyperX',
            switch: 'HyperX Aqua',
            formato: '65%',
            material: 'Aluminio',
          },
          basePrice: BigInt(34900_00),
          stock: 20,
        },
        {
          sku: 'HX-AO65-RED',
          name: 'HyperX Red',
          attributes: {
            marca: 'HyperX',
            switch: 'HyperX Red',
            formato: '65%',
            material: 'Aluminio',
          },
          basePrice: BigInt(34900_00),
          stock: 18,
        },
      ],
    },

    // ------ DIADEMAS / HEADSETS ------
    {
      name: 'SteelSeries Arctis Nova Pro Wireless',
      slug: 'steelseries-arctis-nova-pro-wireless',
      brand: 'SteelSeries',
      description:
        'Headset gaming premium con cancelación activa de ruido (ANC), Hi-Res Audio, batería intercambiable de carga rápida y multiconexión para PC + consola.',
      primarySlug: 'diademas-headsets',
      categories: ['diademas-headsets', 'perifericos'],
      variants: [
        {
          sku: 'SS-ANPW-BLK',
          name: 'Negro',
          attributes: {
            marca: 'SteelSeries',
            color: 'Negro',
            conectividad: 'Inalámbrico 2.4G + BT',
            ANC: 'Sí',
          },
          basePrice: BigInt(129900_00),
          compareAt: BigInt(149900_00),
          stock: 5,
        },
        {
          sku: 'SS-ANPW-WHT',
          name: 'Blanco',
          attributes: {
            marca: 'SteelSeries',
            color: 'Blanco',
            conectividad: 'Inalámbrico 2.4G + BT',
            ANC: 'Sí',
          },
          basePrice: BigInt(129900_00),
          stock: 4,
        },
      ],
    },
    {
      name: 'Razer BlackShark V2 Pro',
      slug: 'razer-blackshark-v2-pro',
      brand: 'Razer',
      description:
        'Headset esports inalámbrico con drivers TriForce Titanium de 50mm, micrófono HyperClear Supercardioid desmontable y Razer HyperSpeed (2.4 GHz). Hasta 70h de batería.',
      primarySlug: 'diademas-headsets',
      categories: ['diademas-headsets', 'perifericos'],
      variants: [
        {
          sku: 'RZ-BSV2P-BLK',
          name: 'Negro',
          attributes: {
            marca: 'Razer',
            color: 'Negro',
            driver: 'TriForce Titanium 50mm',
            batería: '70h',
          },
          basePrice: BigInt(89900_00),
          stock: 8,
        },
      ],
    },

    // ------ MONITORES ------
    {
      name: 'LG UltraGear 27GN950-B',
      slug: 'lg-ultragear-27gn950-b',
      brand: 'LG',
      description:
        'Monitor gaming 4K Nano IPS de 27" a 144 Hz, 1ms GtG, compatible con NVIDIA G-SYNC y AMD FreeSync Premium Pro, HDR 600 y cobertura 98% DCI-P3.',
      primarySlug: 'monitores',
      categories: ['monitores'],
      variants: [
        {
          sku: 'LG-27GN950-B',
          name: '27" 4K 144Hz',
          attributes: {
            marca: 'LG',
            tamaño: '27"',
            resolución: '4K UHD',
            Hz: '144 Hz',
            panel: 'Nano IPS',
          },
          basePrice: BigInt(289900_00),
          compareAt: BigInt(329900_00),
          stock: 6,
        },
      ],
    },
    {
      name: 'MSI MAG 274QRF QD',
      slug: 'msi-mag-274qrf-qd',
      brand: 'MSI',
      description:
        'Monitor gaming 27" QHD (2560×1440) Quantum Dot IPS a 165 Hz, 1ms MPRT, FreeSync Premium Pro, G-SYNC Compatible y soporte VESA.',
      primarySlug: 'monitores',
      categories: ['monitores'],
      variants: [
        {
          sku: 'MSI-274QRF-QD',
          name: '27" QHD 165Hz Quantum Dot',
          attributes: {
            marca: 'MSI',
            tamaño: '27"',
            resolución: 'QHD 1440p',
            Hz: '165 Hz',
            panel: 'IPS QD',
          },
          basePrice: BigInt(169900_00),
          stock: 9,
        },
      ],
    },

    // ------ PROCESADORES ------
    {
      name: 'Intel Core i9-14900K',
      slug: 'intel-core-i9-14900k',
      brand: 'Intel',
      description:
        'Procesador desktop de 24 núcleos (8P + 16E) hasta 6.0 GHz en modo Turbo, compatible con DDR5/DDR4, socket LGA1700. Incluye Intel Thread Director y Wi-Fi 6E integrable.',
      primarySlug: 'procesadores-cpu',
      categories: ['procesadores-cpu'],
      variants: [
        {
          sku: 'INT-I9-14900K',
          name: 'i9-14900K Boxed',
          attributes: {
            marca: 'Intel',
            núcleos: '24',
            socket: 'LGA1700',
            frecuencia: '6.0 GHz Turbo',
            DDR: 'DDR5/DDR4',
          },
          basePrice: BigInt(269900_00),
          compareAt: BigInt(299900_00),
          stock: 10,
        },
      ],
    },
    {
      name: 'AMD Ryzen 9 7950X',
      slug: 'amd-ryzen-9-7950x',
      brand: 'AMD',
      description:
        'Procesador de 16 núcleos / 32 hilos hasta 5.7 GHz, fabricado en 5nm, socket AM5, compatibilidad DDR5 y PCIe 5.0. Ideal para creadores de contenido y gaming extremo.',
      primarySlug: 'procesadores-cpu',
      categories: ['procesadores-cpu'],
      variants: [
        {
          sku: 'AMD-R9-7950X',
          name: 'Ryzen 9 7950X Boxed',
          attributes: {
            marca: 'AMD',
            núcleos: '16',
            socket: 'AM5',
            frecuencia: '5.7 GHz Turbo',
            proceso: '5nm',
          },
          basePrice: BigInt(289900_00),
          stock: 8,
        },
      ],
    },

    // ------ MEMORIA RAM ------
    {
      name: 'Corsair Dominator Platinum RGB DDR5 32GB',
      slug: 'corsair-dominator-platinum-rgb-ddr5-32gb',
      brand: 'Corsair',
      description:
        'Kit de 2×16GB DDR5 a 5600 MHz CL36, con cabezales de aluminio maquinado y LEDs RGB CAPELLIX individualmente iluminados. Compatibilidad Intel XMP 3.0.',
      primarySlug: 'memoria-ram',
      categories: ['memoria-ram'],
      variants: [
        {
          sku: 'CS-DOM-DDR5-5600-32',
          name: '32GB (2×16GB) 5600MHz',
          attributes: {
            marca: 'Corsair',
            capacidad: '32GB',
            velocidad: '5600 MHz',
            tipo: 'DDR5',
            latencia: 'CL36',
          },
          basePrice: BigInt(89900_00),
          compareAt: BigInt(104000_00),
          stock: 14,
        },
        {
          sku: 'CS-DOM-DDR5-6000-32',
          name: '32GB (2×16GB) 6000MHz',
          attributes: {
            marca: 'Corsair',
            capacidad: '32GB',
            velocidad: '6000 MHz',
            tipo: 'DDR5',
            latencia: 'CL30',
          },
          basePrice: BigInt(109900_00),
          stock: 7,
        },
      ],
    },
    {
      name: 'G.Skill Trident Z5 RGB DDR5 64GB',
      slug: 'gskill-trident-z5-rgb-ddr5-64gb',
      brand: 'G.Skill',
      description:
        'Kit 2×32GB DDR5-6000 CL30, con disipador aluminio pulido en dos tonos y RGB direccionable. Certificado Intel XMP 3.0. Perfil bajo para compatibilidad con coolers grandes.',
      primarySlug: 'memoria-ram',
      categories: ['memoria-ram'],
      variants: [
        {
          sku: 'GS-TZ5-DDR5-6000-64',
          name: '64GB (2×32GB) 6000MHz',
          attributes: {
            marca: 'G.Skill',
            capacidad: '64GB',
            velocidad: '6000 MHz',
            tipo: 'DDR5',
            latencia: 'CL30',
          },
          basePrice: BigInt(199900_00),
          stock: 5,
        },
      ],
    },

    // ------ GPU ------
    {
      name: 'NVIDIA GeForce RTX 4080 Super FE',
      slug: 'nvidia-geforce-rtx-4080-super-fe',
      brand: 'NVIDIA',
      description:
        'GPU de referencia NVIDIA con 10,240 CUDA Cores, 16GB GDDR6X, DLSS 3.5, ray tracing de 3.ª gen y Ada Lovelace. Ideal para 4K gaming y creación de contenido.',
      primarySlug: 'tarjetas-graficas-gpu',
      categories: ['tarjetas-graficas-gpu'],
      variants: [
        {
          sku: 'NV-RTX4080S-FE',
          name: 'Founders Edition',
          attributes: {
            marca: 'NVIDIA',
            VRAM: '16GB GDDR6X',
            CUDA: '10,240',
            conectores: '1x 16-pin',
            puertos: '3x DP 1.4a + 1x HDMI 2.1',
          },
          basePrice: BigInt(729900_00),
          stock: 4,
        },
      ],
    },
    {
      name: 'AMD Radeon RX 7900 XTX',
      slug: 'amd-radeon-rx-7900-xtx',
      brand: 'AMD',
      description:
        'GPU de referencia AMD RDNA 3 con 24GB GDDR6, 6144 stream processors, DisplayPort 2.1, soporte AV1 y FidelityFX Super Resolution 3.',
      primarySlug: 'tarjetas-graficas-gpu',
      categories: ['tarjetas-graficas-gpu'],
      variants: [
        {
          sku: 'AMD-RX7900XTX-REF',
          name: 'Reference Edition',
          attributes: {
            marca: 'AMD',
            VRAM: '24GB GDDR6',
            'Stream Processors': '6144',
            puertos: '2x DP 2.1 + 1x HDMI 2.1',
          },
          basePrice: BigInt(629900_00),
          compareAt: BigInt(699900_00),
          stock: 3,
        },
      ],
    },

    // ------ ALMACENAMIENTO ------
    {
      name: 'Samsung 990 Pro NVMe 2TB',
      slug: 'samsung-990-pro-nvme-2tb',
      brand: 'Samsung',
      description:
        'SSD NVMe PCIe 4.0 M.2 con velocidades de lectura hasta 7.450 MB/s y escritura 6.900 MB/s, ideal para gaming y profesionales. Compatible con PS5.',
      primarySlug: 'almacenamiento',
      categories: ['almacenamiento'],
      variants: [
        {
          sku: 'SS-990PRO-1TB',
          name: '1TB',
          attributes: {
            marca: 'Samsung',
            capacidad: '1TB',
            interfaz: 'PCIe 4.0 x4',
            lectura: '7,450 MB/s',
            escritura: '6,900 MB/s',
          },
          basePrice: BigInt(34900_00),
          stock: 20,
        },
        {
          sku: 'SS-990PRO-2TB',
          name: '2TB',
          attributes: {
            marca: 'Samsung',
            capacidad: '2TB',
            interfaz: 'PCIe 4.0 x4',
            lectura: '7,450 MB/s',
            escritura: '6,900 MB/s',
          },
          basePrice: BigInt(62900_00),
          compareAt: BigInt(74000_00),
          stock: 15,
        },
      ],
    },

    // ------ SILLAS GAMER ------
    {
      name: 'Secretlab TITAN Evo 2022',
      slug: 'secretlab-titan-evo-2022',
      brand: 'Secretlab',
      description:
        'Silla premium de cuero NEO Hybrid™ con sistema de reclinado de 4 vías, soporte lumbar magnético, reposacabeza integrado y estructura de acero. Disponible en S, R y XL.',
      primarySlug: 'sillas-gamer',
      categories: ['sillas-gamer'],
      variants: [
        {
          sku: 'SL-TITAN-EVO-S-BLK',
          name: 'Small – Negro/Rojo',
          attributes: {
            marca: 'Secretlab',
            talla: 'S',
            material: 'NEO Hybrid Leather',
            color: 'Negro/Rojo',
            capacidad: '90 kg',
          },
          basePrice: BigInt(279900_00),
          stock: 6,
        },
        {
          sku: 'SL-TITAN-EVO-R-BLK',
          name: 'Regular – Negro/Rojo',
          attributes: {
            marca: 'Secretlab',
            talla: 'R',
            material: 'NEO Hybrid Leather',
            color: 'Negro/Rojo',
            capacidad: '110 kg',
          },
          basePrice: BigInt(299900_00),
          stock: 8,
        },
        {
          sku: 'SL-TITAN-EVO-XL-BLK',
          name: 'XL – Negro/Rojo',
          attributes: {
            marca: 'Secretlab',
            talla: 'XL',
            material: 'NEO Hybrid Leather',
            color: 'Negro/Rojo',
            capacidad: '130 kg',
          },
          basePrice: BigInt(319900_00),
          stock: 4,
        },
      ],
    },
  ];

  let createdProducts = 0;
  let createdVariants = 0;

  for (const p of products) {
    const brand = normalizeBrand(p.brand);
    const product = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } },
      update: {
        name: p.name,
        brand,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        isFeatured: false,
        primaryCategoryId: categories[p.primarySlug],
      },
      create: {
        tenantId: tenant.id,
        name: p.name,
        slug: p.slug,
        brand,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        isFeatured: false,
        primaryCategoryId: categories[p.primarySlug],
      },
    });

    // Link to all categories
    for (const catSlug of p.categories) {
      await prisma.productCategory.upsert({
        where: {
          tenantId_productId_categoryId: {
            tenantId: tenant.id,
            productId: product.id,
            categoryId: categories[catSlug],
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          productId: product.id,
          categoryId: categories[catSlug],
          sortOrder: 0,
        },
      });
    }

    // Variants + inventory
    for (const v of p.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { tenantId_sku: { tenantId: tenant.id, sku: v.sku } },
        update: {},
        create: {
          tenantId: tenant.id,
          productId: product.id,
          sku: v.sku,
          name: v.name,
          attributes: v.attributes,
          basePriceMinor: v.basePrice,
          currency: 'COP',
          compareAtPriceMinor: v.compareAt ?? null,
        },
      });

      await prisma.inventoryBalance.upsert({
        where: { variantId: variant.id },
        update: {},
        create: {
          tenantId: tenant.id,
          variantId: variant.id,
          quantityOnHand: v.stock,
          quantityReserved: 0,
        },
      });

      createdVariants++;
    }

    createdProducts++;
  }

  console.log(`✅ Products: ${createdProducts} | Variants: ${createdVariants}`);
  console.log('🎮 Seed completado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
