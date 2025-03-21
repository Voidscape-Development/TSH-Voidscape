LoadEverything().then(() => {
  gsap.config({ nullTargetWarn: false, trialWarn: false });

  let startingAnimation = gsap
    .timeline({ paused: true })
    .from(".mask", { width: 0, duration: 1, ease: "power2.inOut" }, 0)
    .from(
      ".doubles .info",
      { opacity: 0, duration: 0.5, ease: "power2.inOut" },
      0.8
    );

  Start = async () => {
    startingAnimation.restart();
  };

  Update = async (event) => {
    let data = event.data;
    let oldData = event.oldData;

    for (const [t, team] of [
      data.score[window.scoreboardNumber].team["1"],
      data.score[window.scoreboardNumber].team["2"],
    ].entries()) {
      for (const [p, player] of [team.player["1"]].entries()) {
        if (player) {
          if (Object.keys(team.player).length == 1) {
            SetInnerHtml(
              $(`.t${t + 1}.container .name`),
              `
            <span>
              <span class="sponsor">
                ${player.team ? player.team.toUpperCase() : ""}
              </span>
              ${player.name ? await Transcript(player.name.toUpperCase()) : ""}
              ${team.losers ? "<span class='losers'>L</span>" : ""}
            </span>
            `
            );
          } else {
            let teamName = "";

            if (!team.teamName || team.teamName == "") {
              let names = [];
              for (const [p, player] of Object.values(team.player).entries()) {
                if (player && player.name) {
                  names.push(await Transcript(player.name));
                }
              }
              teamName = names.join(" / ");
            } else {
              teamName = team.teamName;
            }

            SetInnerHtml(
              $(`.t${t + 1}.container .name`),
              `
              <span>
                ${teamName.toUpperCase()}
                ${team.losers ? "<span class='losers'>L</span>" : ""}
              </span>
              `
            );
          }

          SetInnerHtml(
            $(`.t${t + 1}.p${p + 1} .pronoun`),
            Object.keys(team.player).length == 1 ? player.pronoun : ""
          );

          SetInnerHtml(
            $(`.t${t + 1}.p${p + 1} .flagcountry`),
            player.country.asset && Object.keys(team.player).length == 1
              ? `
                <div class='flag' style="background-image: url('../../${player.country.asset.toLowerCase()}')"></div>
              `
              : ""
          );

          SetInnerHtml(
            $(`.t${t + 1}.p${p + 1} .flagstate`),
            player.state.asset && Object.keys(team.player).length == 1
              ? `
                <div class='flag' style="background-image: url('../../${player.state.asset}')"></div>
              `
              : ""
          );

          SetInnerHtml(
            $(`.t${t + 1}.p${p + 1} .twitter`),
            player.twitter && Object.keys(team.player).length == 1
              ? `<span class="twitter_logo"></span>${String(player.twitter)}`
              : ""
          );

          SetInnerHtml(
            $(`.t${t + 1}.p${p + 1} .seed`),
            player.seed ? `Seed ${String(player.seed)}` : ""
          );

          SetInnerHtml($(`.t${t + 1}.p${p + 1} .score`), String(team.score));

          SetInnerHtml($(`.t${t + 1} .doubles_score`), String(team.score));

          SetInnerHtml(
            $(`.t${t + 1}.p${p + 1} .sponsor-container`),
            player.sponsor_logo && Object.keys(team.player).length == 1
              ? `<div class='sponsor-logo' style="background-image: url('../../${player.sponsor_logo}')"></div>`
              : ""
          );

        }
        if(team.color && !tsh_settings["forceDefaultScoreColors"]) {
          document.querySelector(':root').style.setProperty(`--p${t + 1}-score-bg-color`, team.color);
        }
      }
    }

    let phaseTexts = [];
    if (data.tournamentInfo.eventName)
      phaseTexts.push(data.tournamentInfo.eventName);
    if (data.score[window.scoreboardNumber].phase) phaseTexts.push(data.score[window.scoreboardNumber].phase);

    SetInnerHtml($(".info.material_container .phase"), phaseTexts.join(" - "));
    SetInnerHtml(
      $(".info.material_container .tournament_name"),
      data.tournamentInfo.tournamentName
    );

    SetInnerHtml($(".singles .match"), data.score[window.scoreboardNumber].match);

    if (data.score[window.scoreboardNumber].best_of !== 0) {
      document.querySelector('.middle_container').style.justifyContent = 'unset';
      document.querySelector('.middle_container').style.top = '10px';

      const bestOf = data.score[window.scoreboardNumber].best_of;
      const scoreBubblesContainer = document.querySelector('.score-bubbles-container');
      const currentBubbles = scoreBubblesContainer.children.length;
  
      if (currentBubbles < bestOf) {
        for (let i = currentBubbles; i < bestOf; i++) {
          const bubble = document.createElement('div');
          bubble.className = 'score-bubble';
          scoreBubblesContainer.appendChild(bubble);
        }
      } else if (currentBubbles > bestOf) {
        for (let i = currentBubbles; i > bestOf; i--) {
          scoreBubblesContainer.removeChild(scoreBubblesContainer.lastChild);
        }
      }

      // Remove existing p1 and p2 classes
      for (let i = 0; i < bestOf; i++) {
        scoreBubblesContainer.children[i].classList.remove('p1', 'p2');
      }

      // Add p1 class to the score bubbles from the top down
      const team1Score = data.score[window.scoreboardNumber].team["1"].score;
      for (let i = 0; i < team1Score; i++) {
        scoreBubblesContainer.children[i].classList.add('p1');
      }

      // Add p2 class to the score bubbles from the bottom up
      const team2Score = data.score[window.scoreboardNumber].team["2"].score;
      for (let i = 0; i < team2Score; i++) {
        scoreBubblesContainer.children[bestOf - 1 - i].classList.add('p2');
      }
    } else {
      const scoreBubblesContainer = document.querySelector('.score-bubbles-container');
      if (scoreBubblesContainer.lastChild) {
          scoreBubblesContainer.removeChild(scoreBubblesContainer.lastChild);
      }
      document.querySelector('.middle_container').style.justifyContent = 'center';
      document.querySelector('.middle_container').style.top = '0';
    }

    if (
      Object.keys(oldData).length == 0 ||
      Object.keys(oldData.commentary).length 
    ) {
      let html = "";
      Object.values(data.commentary).forEach((commentator, index) => {
        html += `
              <div class="commentator_container commentator${index}">
                  <div class="name"></div>
                  <div class="pronoun"></div>
              </div>
          `;
      });
      console.log({html});
      $(".com_container").html(html);
    }

    for (const [index, commentator] of Object.values(
      data.commentary
    ).entries()) {
      if (commentator.name) {
        $(`.commentator${index}`).css("display", "");
        SetInnerHtml(
          $(`.commentator${index} .name`),
          `
            <span class="mic_icon"></span>
            <span class="team">
              ${commentator.team ? commentator.team + "&nbsp;" : ""}
            </span>
            ${await Transcript(commentator.name)}
          `
        );
        SetInnerHtml($(`.commentator${index} .pronoun`), commentator.pronoun);
        SetInnerHtml(
          $(`.commentator${index} .real_name`),
          commentator.real_name
        );
        SetInnerHtml(
          $(`.commentator${index} .twitter`),
          commentator.twitter ? "@" + commentator.twitter : ""
        );
      } else {
        $(`.commentator${index}`).css("display", "none");
      }
    }
  };
});
