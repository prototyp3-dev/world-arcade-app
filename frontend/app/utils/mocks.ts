

export interface Cartridge {
    id:string,
    name:string
    cover:string
}

interface Achievement {
    id:string,
    name:string,
    cover:string,
    description:string,
    formula:string
}


export const cartridgeMockList:Array<Cartridge> = [
    {
        id: "0",
        name: "Castlevania",
        cover: "nes_castlevania_cover.jpeg"
    },
    {
        id: "1",
        name: "Life Force",
        cover: "nes_lifeForce_cover.jpg"
    },
    {
        id: "2",
        name: "Zelda",
        cover: "nes_thelegendofzelda_cover.jpg"
    },
    {
        id: "3",
        name: "Castlevania",
        cover: "nes_castlevania_cover.jpeg"
    },
    {
        id: "4",
        name: "Life Force",
        cover: "nes_lifeForce_cover.jpg"
    },
    {
        id: "5",
        name: "Zelda",
        cover: "nes_thelegendofzelda_cover.jpg"
    },
    {
        id: "6",
        name: "Castlevania",
        cover: "nes_castlevania_cover.jpeg"
    },
    {
        id: "7",
        name: "Life Force",
        cover: "nes_lifeForce_cover.jpg"
    }
]

export const achievementsMockDict = new Map<string, Array<Achievement>>([
    ["0", [{id: "0", name: "Kill everyone", cover: "", description: "Be a badass and Kill everyone", formula: ""}]],
    ["1", [{id: "1", name: "Do something cool", cover: "", description: "Just do it!", formula: ""}]],
    ["2", [{id: "2", name: "kill Princess Zelda", cover: "", description: "Kill that bitch", formula: ""}]],
    ["3", []],
    ["4", []],
    ["5", []],
    ["6", []],
    ["7", []],
])