import copy
from multiprocessing import Lock
import os
import json
from turtle import update
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
from PyQt5.QtCore import *
import re
import csv
import traceback

from TSHGameAssetManager import TSHGameAssetManager


class TSHPlayerDBSignals(QObject):
    db_updated = pyqtSignal()


class TSHPlayerDB:
    signals = TSHPlayerDBSignals()
    database = {}
    model: QStandardItemModel = None
    fieldnames = ["prefix", "gamerTag", "name", "twitter",
                  "country_code", "state_code", "mains"]
    modelLock = Lock()

    def LoadDB():
        try:
            if os.path.exists("./local_players.csv") == False:
                with open('./local_players.csv', 'w', encoding='utf-8') as outfile:
                    spamwriter = csv.writer(outfile)
                    spamwriter.writerow(TSHPlayerDB.fieldnames)

            with open('./local_players.csv', 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile, quotechar='\'')
                for player in reader:
                    tag = player.get(
                        "prefix")+" "+player.get("gamerTag") if player.get("prefix") else player.get("gamerTag")
                    if tag not in TSHPlayerDB.database:
                        TSHPlayerDB.database[tag] = player

                        try:
                            player["mains"] = json.loads(
                                player.get("mains", "{}"))
                        except:
                            player["mains"] = {}
                            print(traceback.format_exc())

            TSHPlayerDB.SetupModel()
        except Exception as e:
            print(traceback.format_exc())

    def AddPlayers(players, overwrite=False):
        for player in players:
            if player is not None:
                tag = player.get(
                    "prefix")+" "+player.get("gamerTag") if player.get("prefix") else player.get("gamerTag")

                if not overwrite:
                    if tag not in TSHPlayerDB.database:
                        incomingMains = player.get("mains", {})
                        for game in incomingMains:
                            for main in incomingMains[game]:
                                if len(main) == 1:
                                    main.append(0)
                        TSHPlayerDB.database[tag] = player
                    else:
                        dbMains = copy.deepcopy(
                            TSHPlayerDB.database[tag].get("mains", {}))
                        incomingMains = player.get("mains", {})

                        newMains = []
                        for game in incomingMains:
                            for main in incomingMains[game]:
                                if len(main) == 1:
                                    found = next(
                                        (m for m in dbMains.get(game, []) if m[0] == main[0]), None)
                                    if found:
                                        main.append(found[1])
                                    else:
                                        main.append(0)
                                newMains.append(main)
                            dbMains[game] = newMains

                        TSHPlayerDB.database[tag].update(player)
                        TSHPlayerDB.database[tag]["mains"] = dbMains
                else:
                    if TSHPlayerDB.database.get(tag) is not None and player.get("mains") is not None:
                        try:
                            mains = TSHPlayerDB.database[tag].get("mains", {})
                            mains.update(player.get("mains", {}))
                            player["mains"] = mains
                        except:
                            print(traceback.format_exc())
                    TSHPlayerDB.database[tag] = player

        TSHPlayerDB.SaveDB()
        TSHPlayerDB.SetupModel()

    def DeletePlayer(tag):
        if tag in TSHPlayerDB.database:
            del TSHPlayerDB.database[tag]

        TSHPlayerDB.SaveDB()
        TSHPlayerDB.SetupModel()

    def SetupModel():
        with TSHPlayerDB.modelLock:
            TSHPlayerDB.model = QStandardItemModel()

            for player in TSHPlayerDB.database.values():
                if player is not None:
                    tag = player.get(
                        "prefix")+" "+player.get("gamerTag") if player.get("prefix") else player.get("gamerTag")

                    item = QStandardItem(tag)
                    item.setData(player, Qt.ItemDataRole.UserRole)

                    item.setIcon(QIcon(QPixmap.fromImage(QImage("./icons/cancel.svg").scaledToWidth(
                        32, Qt.TransformationMode.SmoothTransformation))))

                    if player.get("mains") and type(player.get("mains")) == dict:
                        if TSHGameAssetManager.instance.selectedGame.get("codename") in player.get("mains", {}).keys():
                            playerMains = player.get(
                                "mains")[TSHGameAssetManager.instance.selectedGame.get("codename")]

                            if playerMains is not None and len(playerMains) > 0:
                                character = next((c for c in TSHGameAssetManager.instance.characters.items(
                                ) if c[0] == playerMains[0][0]), None)
                                if character:
                                    assets = TSHGameAssetManager.instance.GetCharacterAssets(
                                        character[1].get("codename"), playerMains[0][1])

                                    if assets == None:
                                        assets = {}

                                    # Set to use first asset as a fallback
                                    key = list(assets.keys())[0]

                                    for k, asset in list(assets.items()):
                                        if "icon" in asset.get("type", []):
                                            key = k
                                            break
                                        elif "portrait" in asset.get("type", []):
                                            key = k

                                    item.setIcon(
                                        QIcon(QPixmap.fromImage(QImage(assets[key]["asset"]).scaledToWidth(
                                            32, Qt.TransformationMode.SmoothTransformation)))
                                    )

                    TSHPlayerDB.model.appendRow(item)

            TSHPlayerDB.signals.db_updated.emit()

    def SaveDB():
        try:
            with open('./local_players.csv', 'w', encoding="utf-8", newline='') as outfile:
                spamwriter = csv.DictWriter(
                    outfile, fieldnames=TSHPlayerDB.fieldnames, extrasaction="ignore", quotechar='\'')
                spamwriter.writeheader()

                for player in TSHPlayerDB.database.values():
                    if player is not None:
                        playerData = copy.deepcopy(player)

                        if player.get("mains") is not None:
                            playerData["mains"] = json.dumps(player["mains"])

                        spamwriter.writerow(playerData)
        except Exception as e:
            print(traceback.format_exc())


TSHPlayerDB.LoadDB()
TSHGameAssetManager.instance.signals.onLoad.connect(TSHPlayerDB.SetupModel)