
// Written by https://github.com/QubitTooLate
// please don't claim you made it
// https://www.vrt.be/vrtnws/nl/services/rss/

;((() => {
    "use strict";

    const fetch = require("node-fetch");
    const parseXML = require("xml2js").parseString;

    async function VRTArtikelsNaarDiscord(url, webhook, previousDate) {
        const response = await fetch(url);
        const xml = await response.text();
        let title;
        let titleurl;
        let fields = [];
        let newdate = previousDate;

        parseXML(xml, (err, result) => {
            title = result.feed.title[0]._;
            titleurl = result.feed.link[1].$.href;

            let i = 0;
            while (true) {
                let entry = result.feed.entry[i];
                if (typeof entry !== "undefined") {
                    let date = new Date(entry.published[0]);
    
                    if (date > previousDate) {
                        if (date > newdate) {
                            newdate = date;
                        }

                        if (
                            !entry.title[0]._.includes("\"De zevende dag\"")
                            ) {
                            fields.push({
                                "name": entry.title[0]._,
                                "value": `${entry.summary[0]._}\n\n**[${entry["vrtns:nstag"][0]._}]** Gepubliceerd op: ${entry.published[0].substr(0, 10)}\n[Spring naar artikel](${entry.link[1].$.href})`
                            });
                        }
                    } else {
                        break;
                    }
                }

                ++i;
            }
        });

        if (fields.length > 0) {
            await fetch(webhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "embeds": [
                      {
                        "title": title,
                        //"description": "Auteur: " + result.feed.author[0].name[0] + "\nDe headlines van het moment",
                        "url": titleurl,
                        "color": 65433,
                        "fields": fields
                      }
                    ]
                })
            });
        }

        return newdate;
    }

    let artikelDatums = [ new Date(2020, 5, 21, 20), new Date(2020, 5, 21, 20), new Date(2020, 5, 21, 20) ];
    async function checkVRTArtikels() {
        let t0 = VRTArtikelsNaarDiscord(
            "https://www.vrt.be/vrtnws/nl.rss.politiek.xml",
            "https://discordapp.com/api/webhooks/...",
            artikelDatums[0]
        );
    
        let t1 = VRTArtikelsNaarDiscord(
            "https://www.vrt.be/vrtnws/nl.rss.economie.xml",
            "https://discordapp.com/api/webhooks/...",
            artikelDatums[1]
        );
    
        let t2 = VRTArtikelsNaarDiscord(
            "https://www.vrt.be/vrtnws/nl.rss.wetenschap.xml",
            "https://discordapp.com/api/webhooks/...",
            artikelDatums[2]
        );

        artikelDatums[0] = await t0;
        artikelDatums[1] = await t1;
        artikelDatums[2] = await t2;

        console.log(`Checked artikels ${artikelDatums[0].toUTCString()}, ${artikelDatums[1].toUTCString()}, ${artikelDatums[2].toUTCString()}.`);
    }

    checkVRTArtikels();
    setInterval(checkVRTArtikels, 1000 * 60 * 60);
})());
