// Motore Asso World: egg click.
import * as dependencies from "./dependencies";

export function installEggClick(engine) {
  engine.eggClick = function(eg) {
    if (engine.st.t < engine.st.eggCd)
        return;
    engine.st.eggCd = engine.st.t + 1;
    engine.sfx.click();
    /* nello Shadow Realm tutte le battute diventano profetiche */
    if (engine.st.shadow) {
        engine.showBubble(dependencies.SHADOW_LINES[Math.floor(Math.random() * dependencies.SHADOW_LINES.length)], 3.2);
        return;
    }
    let key = eg.key;
    if (key === "window" && engine.phase.id === "night")
        key = "windowNight";
    let lines = dependencies.EGG_LINES[key] || dependencies.EGG_LINES.window;
    if (eg.key === "stats") {
        const wr = engine.stats.giocati ? Math.round((engine.stats.vinti / engine.stats.giocati) * 100) : 0;
        lines = ["🏅 " + engine.stats.vinti + " vittorie su " + engine.stats.giocati + " tornei · WR " + wr + "%"];
    }
    else if (eg.key === "posterWeek" && engine.posters && engine.posters.week) {
        lines = ["⭐ «" + engine.posters.week.nome + "»: " + dependencies.WEEK_LINES[Math.floor(Math.random() * dependencies.WEEK_LINES.length)]];
    }
    else if (eg.key === "posterBan" && engine.posters && engine.posters.ban) {
        lines = ["🔨 «" + engine.posters.ban.nome + "» — " + dependencies.BAN_LINES[Math.floor(Math.random() * dependencies.BAN_LINES.length)]];
    }
    engine.showBubble(lines[Math.floor(Math.random() * lines.length)], 3.2);
};
}
