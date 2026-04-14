import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const backgroundsDir = path.join(root, "assets", "backgrounds");
const metadataPath = path.join(backgroundsDir, "sources.json");

const sources = [
    {
        id: "savanna",
        title: "Sunrise Over African Savanna With Leafless Tree",
        terrain: "Savanna",
        pageUrl: "https://www.pexels.com/photo/sunrise-over-african-savanna-with-leafless-tree-33621858/",
        imageUrl: "https://images.pexels.com/photos/33621858/pexels-photo-33621858.jpeg?auto=compress&cs=tinysrgb&w=2400"
    },
    {
        id: "highlands",
        title: "Scenic African Landscape With Rolling Hills",
        terrain: "Red-earth Highlands",
        pageUrl: "https://www.pexels.com/photo/scenic-african-landscape-with-rolling-hills-36174042/",
        imageUrl: "https://images.pexels.com/photos/36174042/pexels-photo-36174042.jpeg?auto=compress&cs=tinysrgb&w=2400"
    },
    {
        id: "dunes",
        title: "Stunning Dunes In Namibia Desert",
        terrain: "Dunes / Desert",
        pageUrl: "https://www.pexels.com/photo/stunning-dunes-in-namibia-desert-31643836/",
        imageUrl: "https://images.pexels.com/photos/31643836/pexels-photo-31643836.jpeg?auto=compress&cs=tinysrgb&w=2400"
    },
    {
        id: "canopy",
        title: "Blyde River Canyon Lush Green Mountains",
        terrain: "Forest Belt / Canopy",
        pageUrl: "https://www.pexels.com/photo/breathtaking-view-of-blyde-river-canyon-s-lush-green-mountains-and-cloudy-sky-at-south-africa-31881358/",
        imageUrl: "https://images.pexels.com/photos/31881358/pexels-photo-31881358.jpeg?auto=compress&cs=tinysrgb&w=2400"
    },
    {
        id: "coast",
        title: "A Rocky Coast With Cliffs",
        terrain: "Escarpment Coast",
        pageUrl: "https://www.pexels.com/photo/a-rocky-coast-with-cliffs-15601546/",
        imageUrl: "https://images.pexels.com/photos/15601546/pexels-photo-15601546.jpeg?auto=compress&cs=tinysrgb&w=2400"
    }
];

async function fetchBuffer(url) {
    const response = await fetch(url, {
        headers: {
            "user-agent": "Hill-Cruze-Asset-Fetcher/1.0"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

async function main() {
    await fs.mkdir(backgroundsDir, { recursive: true });

    for (const source of sources) {
        const outputPath = path.join(backgroundsDir, `${source.id}.webp`);
        const buffer = await fetchBuffer(source.imageUrl);
        await sharp(buffer)
            .resize(1920, 1080, { fit: "cover", position: "attention" })
            .webp({ quality: 82 })
            .toFile(outputPath);
        console.log(`Saved ${outputPath}`);
    }

    await fs.writeFile(metadataPath, JSON.stringify(sources, null, 2));
    console.log(`Wrote ${metadataPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
