(async () => {
    const { importGtfs } = await import('gtfs');
    const { createHash } = await import('crypto');
    const { readFile, writeFile, mkdir } = await import('fs/promises');
    await mkdir('./feeds', { recursive: true });
    await mkdir('./checksums', { recursive: true });
    const agenciesData = await fetch('https://api.511.org/transit/gtfsoperators?api_key=7cf5660e-215b-489d-87b1-78bb3ee006b7').then(res => res.json());
    const agencies = agenciesData.filter(agency => agency['Id'] !== 'RG');
    const anchors = await Promise.all(agencies.map(async agency => {
        const config =  {
            sqlitePath: `./feeds/${agency['Id']}.db`,
            agencies: [
                {
                    url: `https://api.511.org/transit/datafeeds?operator_id=${agency['Id']}&api_key=7cf5660e-215b-489d-87b1-78bb3ee006b7`
                }
            ],
        }
        await importGtfs(config);
        const db = await readFile(`./feeds/${agency['Id']}.db`);
        const hashSum = createHash('md5');
        hashSum.update(db);
        const hash = hashSum.digest('hex');
        await writeFile(`./checksums/${agency['Id']}.checksum`, hash);

        return `<li><a href="./feeds/${agency['Id']}.db">${agency['Id']}.db</a> (<a href="./checksums/${agency['Id']}.checksum">Checksum</a>)</li>`;
    }));
    writeFile('./index.html', `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OnTime Transit Feeds</title>
    </head>
    <body>
        <ul>
            ${anchors.join('\n\t\t\t')}
        </ul>
        
    </body>
</html>`);
})();
