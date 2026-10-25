        function scriptIconSrc() {
            const meta = (GM_info.scriptMetaStr || '').match(/^\/\/ @icon\s+(.+?)\s*$/m);
            return (GM_info.script && GM_info.script.icon) || (meta && meta[1]) || null;
        }

        const APP_ICONS = [
            { id: "classic", name: "Классика", svg: null },
            { id: "itd", name: "ИТД", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0d13\"/><text x=\"32\" y=\"39.5\" text-anchor=\"middle\" font-family=\"Arial Black, Arial, sans-serif\" font-weight=\"900\" font-size=\"20\" fill=\"url(#n)\">ИТД</text><text x=\"32\" y=\"50\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-weight=\"700\" font-size=\"8\" fill=\"#fff\" opacity=\".7\" letter-spacing=\"1.5\">X</text></svg>" },
            { id: "neon", name: "Неон", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient><filter id=\"g\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"3\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0d13\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#n)\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#g)\" opacity=\".9\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#n)\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".55\"/></svg>" },
            { id: "glitch", name: "Глитч", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0b10\"/><g transform=\"translate(-2.5 0)\" opacity=\".95\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#00f0ff\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /></g><g transform=\"translate(2.5 0)\" opacity=\".95\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#ff2bd6\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /></g><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /><rect x=\"14\" y=\"30\" width=\"36\" height=\"3\" fill=\"#0b0b10\" opacity=\".85\"/></svg>" },
            { id: "orbit", name: "Орбита", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0d13\"/><ellipse cx=\"32\" cy=\"32\" rx=\"23\" ry=\"9\" fill=\"none\" stroke=\"url(#n)\" stroke-width=\"2.2\" transform=\"rotate(-25 32 32)\" opacity=\".9\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /><circle cx=\"51.5\" cy=\"22.5\" r=\"2.6\" fill=\"#ff3d9a\"/></svg>" },
            { id: "matrix", name: "Матрица", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><filter id=\"g\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"2.5\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#020a02\"/><text x=\"4\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">ア</text><text x=\"4\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">エ</text><text x=\"4\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">キ</text><text x=\"4\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">コ</text><text x=\"4\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">ス</text><text x=\"4\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">タ</text><text x=\"4\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">テ</text><text x=\"13\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">ク</text><text x=\"13\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">サ</text><text x=\"13\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">セ</text><text x=\"13\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">チ</text><text x=\"13\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">ト</text><text x=\"13\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">ア</text><text x=\"13\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">エ</text><text x=\"22\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ソ</text><text x=\"22\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">ツ</text><text x=\"22\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">0</text><text x=\"22\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">イ</text><text x=\"22\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">オ</text><text x=\"22\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">ク</text><text x=\"22\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">サ</text><text x=\"31\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">1</text><text x=\"31\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ウ</text><text x=\"31\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">カ</text><text x=\"31\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">ケ</text><text x=\"31\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">シ</text><text x=\"31\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">ソ</text><text x=\"31\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">ツ</text><text x=\"40\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">キ</text><text x=\"40\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">コ</text><text x=\"40\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ス</text><text x=\"40\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">タ</text><text x=\"40\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">テ</text><text x=\"40\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">1</text><text x=\"40\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">ウ</text><text x=\"49\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">セ</text><text x=\"49\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">チ</text><text x=\"49\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">ト</text><text x=\"49\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ア</text><text x=\"49\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">エ</text><text x=\"49\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">キ</text><text x=\"49\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">コ</text><text x=\"58\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">0</text><text x=\"58\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">イ</text><text x=\"58\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">オ</text><text x=\"58\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">ク</text><text x=\"58\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">サ</text><text x=\"58\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">セ</text><text x=\"58\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">チ</text><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#39ff14\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#g)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#39ff14\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"none\" /><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#d8ffd0\" stroke-width=\"2.5\" stroke-linecap=\"round\" fill=\"none\" opacity=\".8\"/></svg>" },
            { id: "gold", name: "Золото", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><radialGradient id=\"bg\" cx=\".5\" cy=\".4\" r=\".75\"><stop offset=\"0\" stop-color=\"#2a1f0c\"/><stop offset=\"1\" stop-color=\"#0b0906\"/></radialGradient><linearGradient id=\"au\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"16\" x2=\"0\" y2=\"48\"><stop offset=\"0\" stop-color=\"#fff2c2\"/><stop offset=\".35\" stop-color=\"#f3cb62\"/><stop offset=\".7\" stop-color=\"#dba53a\"/><stop offset=\"1\" stop-color=\"#c48a24\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#bg)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#au)\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></svg>" },
            { id: "itdchan", name: "ИТД-чан", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1a0d10\"/><stop offset=\"1\" stop-color=\"#0b0708\"/></linearGradient><linearGradient id=\"red\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#e2233b\"/><stop offset=\"1\" stop-color=\"#8e0f22\"/></linearGradient><radialGradient id=\"bell\" cx=\".38\" cy=\".32\" r=\".75\"><stop offset=\"0\" stop-color=\"#ffffff\"/><stop offset=\".45\" stop-color=\"#c9c9d1\"/><stop offset=\"1\" stop-color=\"#6d6d78\"/></radialGradient></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"url(#bg)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#red)\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g></svg>" },
            { id: "gradient", name: "Градиент", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient><filter id=\"s\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.5\" flood-opacity=\".35\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#n)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#s)\"/></svg>" },
            { id: "glass", name: "Стекло", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><filter id=\"b\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"7\"/></filter><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"#0d0f1a\"/><circle cx=\"16\" cy=\"18\" r=\"16\" fill=\"#00c6ff\" filter=\"url(#b)\"/><circle cx=\"50\" cy=\"48\" r=\"18\" fill=\"#ff3d9a\" filter=\"url(#b)\"/><circle cx=\"46\" cy=\"14\" r=\"11\" fill=\"#7c4dff\" filter=\"url(#b)\"/><rect x=\"10\" y=\"10\" width=\"44\" height=\"44\" rx=\"14\" fill=\"#fff\" fill-opacity=\".12\" stroke=\"#fff\" stroke-opacity=\".35\"/></g><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"none\" /></svg>" },
            { id: "paw", name: "Лапка", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath><linearGradient id=\"db\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#6d28d9\"/><stop offset=\"1\" stop-color=\"#4c1d95\"/></linearGradient></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"url(#db)\"/><g fill=\"#ede4ff\"><ellipse cx=\"20\" cy=\"30\" rx=\"3.7\" ry=\"4.7\" transform=\"rotate(-22 20 30)\"/><ellipse cx=\"27.3\" cy=\"22.3\" rx=\"3.9\" ry=\"5.1\" transform=\"rotate(-6 27.3 22.3)\"/><ellipse cx=\"36.7\" cy=\"22.3\" rx=\"3.9\" ry=\"5.1\" transform=\"rotate(6 36.7 22.3)\"/><ellipse cx=\"44\" cy=\"30\" rx=\"3.7\" ry=\"4.7\" transform=\"rotate(22 44 30)\"/></g><path d=\"M32 34c-5.6 0-10.4 4.6-11.5 9-.9 3.6 1.5 6.6 4.9 6.6 2.6 0 4.4-1.3 6.6-1.3s4 1.3 6.6 1.3c3.4 0 5.8-3 4.9-6.6C42.4 38.6 37.6 34 32 34Z\" fill=\"#ede4ff\"/></g></svg>" },
            { id: "sakura", name: "Сакура", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#3a1330\"/><stop offset=\"1\" stop-color=\"#1c0a1a\"/></linearGradient><radialGradient id=\"halo\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#ff7fb0\" stop-opacity=\".35\"/><stop offset=\"1\" stop-color=\"#ff7fb0\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"pgA\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"20\"><stop offset=\"0\" stop-color=\"#fff6f9\"/><stop offset=\".45\" stop-color=\"#ffd3e2\"/><stop offset=\"1\" stop-color=\"#ff8db4\"/></radialGradient><radialGradient id=\"pgB\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"20\"><stop offset=\"0\" stop-color=\"#ffe9f1\"/><stop offset=\"1\" stop-color=\"#ff9cbf\"/></radialGradient><radialGradient id=\"cg\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#ff9ab8\"/><stop offset=\"1\" stop-color=\"#c8356a\"/></radialGradient><filter id=\"sh\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feDropShadow dx=\"0\" dy=\"1.2\" stdDeviation=\"1.3\" flood-color=\"#12040f\" flood-opacity=\".55\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#bg)\"/><circle cx=\"31\" cy=\"33\" r=\"24\" fill=\"url(#halo)\"/><g transform=\"translate(31 33.5) rotate(-14) scale(1.05)\"><g filter=\"url(#sh)\"><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(0)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(0)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(72)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(72)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(144)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(144)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(216)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(216)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(288)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(288)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/></g><circle r=\"3.4\" fill=\"url(#cg)\"/><path d=\"M2.57 0.36L6.34 0.89\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"6.34\" cy=\"0.89\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M1.97 1.7L5.53 4.76\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"5.53\" cy=\"4.76\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M0.74 2.49L2.34 7.86\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"2.34\" cy=\"7.86\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-0.72 2.5L-1.78 6.15\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-1.78\" cy=\"6.15\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-1.96 1.71L-5.5 4.8\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-5.5\" cy=\"4.8\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-2.57 0.38L-8.11 1.19\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-8.11\" cy=\"1.19\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-2.37 -1.07L-5.83 -2.64\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-5.83\" cy=\"-2.64\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-1.41 -2.18L-3.97 -6.13\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-3.97\" cy=\"-6.13\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-0.01 -2.6L-0.03 -8.2\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-0.03\" cy=\"-8.2\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M1.4 -2.19L3.44 -5.39\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"3.44\" cy=\"-5.39\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M2.36 -1.09L6.63 -3.05\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"6.63\" cy=\"-3.05\" r=\".85\" fill=\"#ffd66b\"/></g><g transform=\"translate(49 15) rotate(38) scale(.42)\"><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" fill=\"url(#pgB)\" opacity=\".9\"/></g><g transform=\"translate(14.5 52) rotate(-120) scale(.3)\"><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" fill=\"url(#pgB)\" opacity=\".75\"/></g></svg>" },
            { id: "minimal", name: "Минимал", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#f4f4f6\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#111\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\" /></svg>" },
            { id: "minimal2", name: "Минимал 2", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath><clipPath id=\"L\"><rect width=\"32\" height=\"64\"/></clipPath><clipPath id=\"R\"><rect x=\"32\" width=\"32\" height=\"64\"/></clipPath></defs><g clip-path=\"url(#c)\"><rect width=\"32\" height=\"64\" fill=\"#f4f4f6\"/><rect x=\"32\" width=\"32\" height=\"64\" fill=\"#111\"/><g clip-path=\"url(#L)\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#111\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g><g clip-path=\"url(#R)\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#f4f4f6\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g></g></svg>" },
            { id: "printstream", name: "Принтстрим", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"pearl\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf4f7\"/><stop offset=\".3\" stop-color=\"#f3e6ee\"/><stop offset=\".55\" stop-color=\"#eeeef6\"/><stop offset=\".8\" stop-color=\"#e5edf6\"/><stop offset=\"1\" stop-color=\"#f4f6f9\"/></linearGradient><linearGradient id=\"sheen\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\"0\"/><stop offset=\".5\" stop-color=\"#fff\" stop-opacity=\".7\"/><stop offset=\"1\" stop-color=\"#fff\" stop-opacity=\"0\"/></linearGradient><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"url(#pearl)\"/><rect x=\"-20\" y=\"-6\" width=\"30\" height=\"90\" fill=\"url(#sheen)\" transform=\"rotate(-30 32 32)\" opacity=\".8\"/><g stroke=\"#111\" stroke-width=\"2.2\" stroke-linecap=\"round\"><path d=\"M11 10l4.5 4.5M15.5 10l-4.5 4.5\"/></g><g stroke=\"#111\" stroke-linecap=\"round\" fill=\"none\" opacity=\".55\"><path d=\"M40 52h14M46 49.5h8\" stroke-width=\".7\"/></g><g fill=\"#111\"><rect x=\"44\" y=\"10.5\" width=\"1.6\" height=\"1.6\"/><rect x=\"45.6\" y=\"12.1\" width=\"1.6\" height=\"1.6\"/><rect x=\"47.2\" y=\"10.5\" width=\"1.6\" height=\"1.6\"/><rect x=\"48.8\" y=\"12.1\" width=\"1.6\" height=\"1.6\"/></g><path d=\"M17.60 51.50L15.00 53.00L12.40 51.50L12.40 48.50L15.00 47.00L17.60 48.50Z\" fill=\"none\" stroke=\"#111\" stroke-width=\".7\" opacity=\".55\"/><path d=\"M18.5 10l4.5 4.5M23 10l-4.5 4.5\" stroke=\"#111\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M18.5 10l4.5 4.5M23 10l-4.5 4.5\" stroke=\"#f1eef5\" stroke-width=\".8\" stroke-linecap=\"round\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#111\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g></svg>" },
            { id: "uwu", name: "UwU", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f7dfb3\"/><stop offset=\".55\" stop-color=\"#f5bfb2\"/><stop offset=\"1\" stop-color=\"#ef93b3\"/></linearGradient><radialGradient id=\"glow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#fff2c7\"/><stop offset=\".4\" stop-color=\"#ffe1a0\" stop-opacity=\".75\"/><stop offset=\"1\" stop-color=\"#ffe1a0\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"vig\" cx=\".5\" cy=\".45\" r=\".75\"><stop offset=\".6\" stop-color=\"#8f4f72\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#8f4f72\" stop-opacity=\".22\"/></radialGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#bg)\"/><path d=\"M17 26v6a5 5 0 0 0 10 0v-6\" stroke=\"#1a1016\" stroke-width=\"3.4\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M37 26v6a5 5 0 0 0 10 0v-6\" stroke=\"#1a1016\" stroke-width=\"3.4\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M26 40q3 4 6 0 3 4 6 0\" stroke=\"#1a1016\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/></svg>" },
            { id: "xxx", name: "XXX", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#000\"/><path d=\"M8 24h4.8L15.0 30.1L17.2 24H22L18.0 32.5L22 41h-4.8L15.0 34.9L12.8 41H8L12.0 32.5Z\" fill=\"#fff\"/><rect x=\"25\" y=\"19\" width=\"32\" height=\"27\" rx=\"6\" fill=\"#ff9000\"/><path d=\"M28.5 24h4.1L34.5 30.1L36.4 24H40.5L37.0 32.5L40.5 41h-4.1L34.5 34.9L32.6 41H28.5L32.0 32.5Z\" fill=\"#000\"/><path d=\"M41.5 24h4.1L47.5 30.1L49.4 24H53.5L50.0 32.5L53.5 41h-4.1L47.5 34.9L45.6 41H41.5L45.0 32.5Z\" fill=\"#000\"/></svg>" },
        ];
        const ICON_BG_EXTRA = {
            shimmer: ['#7c3aed', '#a78bfa', '#f0abfc'],
            glitch: ['#00fff0', '#7c4dff', '#ff00c8'],
            rainbow: ['#ff3b3b', '#ffb000', '#3ddc84', '#29b6f6', '#b04dff']
        };
        let iconBgList = null;
        function iconBgs() {
            if (iconBgList) return iconBgList;
            iconBgList = styleKeys.map(k => {
                const st = nickStyles[k];
                const c = ICON_BG_EXTRA[k] || ((st.gradientDark || '').match(/#[0-9a-f]{3,6}\b/gi)) || [st.color];
                return { id: k, name: st.name, c };
            });
            iconBgList.push({ id: 'black', name: 'Чёрный', c: ['#26262c', '#050507'] });
            const MULTI = ['glitch', 'rainbow'], NEUTRAL = ['white', 'gray', 'black'];
            const rank = b => {
                if (MULTI.includes(b.id)) return 1000 + MULTI.indexOf(b.id);
                const h = hueOf(b.c[0]);
                return h === null ? 2000 + Math.max(0, NEUTRAL.indexOf(b.id)) : (h + 330) % 360;
            };
            iconBgList.sort((a, b) => rank(a) - rank(b));
            return iconBgList;
        }
        const svgUrl = svg => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        const xmlText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        function firstGrapheme(s) {
            s = (s || '').trim();
            if (!s) return '';
            if (window.Intl && Intl.Segmenter) return new Intl.Segmenter().segment(s)[Symbol.iterator]().next().value.segment;
            return Array.from(s)[0];
        }
        function customIconSvg({ bg, emoji }) {
            const b = iconBgs().find(x => x.id === bg) || iconBgs().find(x => x.id === 'purpleMystic');
            const stops = b.c.map((c, i) => `<stop offset="${b.c.length > 1 ? i / (b.c.length - 1) : 0}" stop-color="${c}"/>`).join('');
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>` +
                `<rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-size="36">${xmlText(emoji || '🦊')}</text></svg>`;
        }
        let appIcon = GM_getValue('appIcon', 'classic');
        const iconCustom = () => GM_getValue('appIconCustom', { bg: 'purpleMystic', emoji: '🦊' });
        function iconSrcById(id) {
            if (id === 'image') return GM_getValue('appIconImage', '') || scriptIconSrc();
            if (id === 'custom') return svgUrl(customIconSvg(iconCustom()));
            const it = APP_ICONS.find(i => i.id === id);
            return it && it.svg ? svgUrl(it.svg) : scriptIconSrc();
        }
        const appIconSrc = () => iconSrcById(appIcon);
        function scriptLogo(size) {
            const src = appIconSrc();
            if (!src) return null;
            const img = document.createElement('img');
            img.className = 'vp-app-logo';
            img.src = src;
            img.alt = 'ИТД';
            img.width = img.height = size;
            img.style.cssText = `width:${size}px;height:${size}px;display:block;border-radius:${Math.round(size * 0.25)}px;`;
            return img;
        }
        function sizedSvg(src, size) {
            const m = src.match(/^data:image\/svg\+xml(;[^,]*)?,(.*)$/s);
            if (!m) return src;
            let svg = (m[1] || '').includes('base64') ? atob(m[2]) : decodeURIComponent(m[2].replace(/%(?![0-9a-f]{2})/gi, '%25'));
            svg = svg.replace(/<svg\b([^>]*)>/, (all, attrs) => '<svg' + attrs.replace(/\s(width|height)=(["'])[^"']*\2/g, '') + ` width="${size}" height="${size}">`);
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }
        function iconPng(src, size) {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = c.height = size;
                    const g = c.getContext('2d');
                    g.imageSmoothingQuality = 'high';
                    g.drawImage(img, 0, 0, size, size);
                    try { resolve(c.toDataURL('image/png')); } catch (e) { resolve(null); }
                };
                img.onerror = () => resolve(null);
                img.src = sizedSvg(src, size);
            });
        }
        function headLink(id, rel, attrs) {
            let l = document.getElementById(id);
            if (!l) {
                l = document.createElement('link');
                l.id = id;
                l.rel = rel;
                document.head.appendChild(l);
            }
            for (const k in attrs) if (l.getAttribute(k) !== attrs[k]) l.setAttribute(k, attrs[k]);
            return l;
        }
        let pngFor = null;
        function applyAppIcon() {
            const src = appIconSrc();
            if (!src) return;
            headLink('vp-favicon', 'icon', { type: src.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png', href: src });
            document.querySelectorAll('img.vp-app-logo').forEach(img => { if (img.src !== src) img.src = src; });
            if (pngFor === src) return;
            pngFor = src;
            iconPng(src, 512).then(png => { if (png && pngFor === src) headLink('vp-icon-512', 'icon', { type: 'image/png', sizes: '512x512', href: png }); });
            iconPng(src, 192).then(png => { if (png && pngFor === src) headLink('vp-icon-192', 'icon', { type: 'image/png', sizes: '192x192', href: png }); });
            iconPng(src, 180).then(png => { if (png && pngFor === src) headLink('vp-touch-icon', 'apple-touch-icon', { sizes: '180x180', href: png }); });
        }
        function setAppIcon(id) {
            appIcon = id;
            GM_setValue('appIcon', id);
            applyAppIcon();
        }

        const TAB_TITLE = 'ИТД X';
        function brandTab() {
            if (document.title !== TAB_TITLE) document.title = TAB_TITLE;
            document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(l => { if (!l.id.startsWith('vp-')) l.remove(); });
            applyAppIcon();
        }
        const svgIcon = (body, size = 20, stroke = 'currentColor') =>
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
        const I_BG = '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 8.2l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/><path d="M17.5 6.8v1.6M16.7 7.6h1.6"/>';

        const UI_GLYPH = {
            reply: '<path d="M9 5 3 11l6 6"/><path d="M3 11h9a8 8 0 0 1 8 8v1"/>',
            pin: '<path d="M9 4h6l-1 6 3 3H7l3-3-1-6Z"/><path d="M12 13v7"/>',
            fwd: '<path d="M15 5l6 6-6 6"/><path d="M21 11h-9a8 8 0 0 0-8 8"/>',
            trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/><path d="M10 11v5M14 11v5"/>',
            check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/>',
            save: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>',
            lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
            ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
            phone: GLYPH.phone,
            image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="m20 15-4-4-8 8"/>',
            copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
            play: '<path d="m9 6.5 8 5.5-8 5.5z"/>',
            out: '<path d="M8 16 16 8M9.5 8H16v6.5"/>',
            close: GLYPH.close
        };
        const uiIcon = (name, size = 18, cls = '') => svgIcon(UI_GLYPH[name], size).replace('<svg ', `<svg class="vp-ico${cls ? ' ' + cls : ''}" `);

        const ICONS = {
            settings: {
                'Фон': svgIcon(I_BG),
                'Неоновая подсветка': svgIcon('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>'),
                'Подсветка ника': svgIcon('<path d="M4 19 9 5h1l5 14M5.8 14.5h7.4"/><path d="M18.5 3.5v4M16.5 5.5h4"/><path d="M19 11.5v2M18 12.5h2"/>'),
                'Подсветка аватарок': svgIcon('<circle cx="12" cy="10" r="3"/><path d="M7 17.5a5.5 5.5 0 0 1 10 0"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="2.2 2.6"/>'),
                'Подсветка постов': svgIcon('<rect x="5" y="6" width="14" height="12" rx="2.5"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/><rect x="2" y="3" width="20" height="18" rx="4.5" stroke-dasharray="2.2 2.6"/>'),
                'Размытый фон постов': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="5" stroke-dasharray="1.4 2"/>'),
                'Анти цензура': svgIcon('<path d="M12 3 5 6v5.2c0 4.3 2.9 7.9 7 9.8 1.6-.7 3-1.7 4.1-3M19 13.5c.1-.8.2-1.5.2-2.3V6L12 3"/><path d="m3 3 18 18"/>'),
                'Стиль фона': svgIcon(I_BG),
                'Стекло': svgIcon('<rect x="3" y="3" width="13" height="13" rx="3"/><rect x="8" y="8" width="13" height="13" rx="3"/><path d="M11.5 15.5l3-3M11.5 18.5l6-6"/>'),
                'Звуки интерфейса': svgIcon('<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11"/>'),
                'Боковая панель': svgIcon('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M15 3v18"/><path d="M17.5 7.5h1M17.5 11h1M17.5 14.5h1"/>'),
                'Версия для ПК на планшете': svgIcon('<rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M9 21h6"/><path d="M6 9h6M6 12h4"/>'),
                'Листание вкладок': svgIcon('<rect x="5" y="3" width="14" height="7" rx="2"/><rect x="5" y="14" width="14" height="7" rx="2" stroke-dasharray="2 2.4"/><path d="M12 10.8v2.4M10.3 11.7 12 13.2l1.7-1.5"/>'),
                'Сцена ленты': svgIcon('<rect x="5" y="3" width="14" height="5" rx="1.5" stroke-dasharray="2 2"/><rect x="4" y="10" width="16" height="5" rx="1.5"/><rect x="3" y="17" width="18" height="5" rx="1.5"/>'),
                'Свечение видео': svgIcon('<rect x="6" y="7" width="12" height="10" rx="2"/><path d="m11 10 3 2-3 2z"/><path d="M3 5.5 4.5 7M21 5.5 19.5 7M3 18.5 4.5 17M21 18.5 19.5 17M12 2.5v2M12 19.5v2"/>'),
                'Заставка при входе': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3z"/>'),
                'Мику и Тето': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="13" r="2"/><circle cx="15.5" cy="13" r="2"/><path d="M5 20c.5-2 2-3 3.5-3s3 1 3.5 3M12 20c.5-2 2-3 3.5-3s3 1 3.5 3"/>'),
                'Мику справа': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="16" cy="13" r="2.2"/><path d="M12 20c.6-2.2 2.2-3.3 4-3.3s3.4 1.1 4 3.3"/>'),
                'Тето слева': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="13" r="2.2"/><path d="M4 20c.6-2.2 2.2-3.3 4-3.3s3.4 1.1 4 3.3"/>'),
                'Автолайки': svgIcon('<path transform="translate(.5 1) scale(.74)" stroke-width="2.43" d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M21.3 17.2a3.3 3.3 0 1 1-1-2.4"/><path d="M21 12.9v2.3h-2.3"/>')
            },

            PALETTE: svgIcon('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/><circle cx="17" cy="10.5" r="1"/>'),
            SLIDERS: svgIcon('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>', 17),
            MESSAGES: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M5 3a3 3 0 00-3 3v10a3 3 0 003 3h1v2.47a.5.5 0 00.85.36L11.12 19H19a3 3 0 003-3V6a3 3 0 00-3-3H5zm2 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>`,
            SCROLL_TOP: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4.5h14M12 20V9M7 13.5l5-5 5 5"/></svg>',
            BANNER_IMAGE: svgIcon('<path d="M20 12.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7a2.5 2.5 0 0 1 2.5-2.5H12"/><circle cx="9" cy="9.5" r="1.5"/><path d="m20 15.5-3.5-3.5L8 19.5"/><path d="M18 2.5v6M15 5.5h6"/>'),
            BANNER_CHANGE: svgIcon('<path d="M20 11.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7a2.5 2.5 0 0 1 2.5-2.5h5"/><circle cx="9" cy="9.5" r="1.5"/><path d="m20 15.5-3.5-3.5L8 19.5"/><path d="M15 6.5a3 3 0 0 1 5.2-1.8M21 3v2.4h-2.4"/>'),
            BANNER_CANCEL: svgIcon(GLYPH.close),
            BANNER_APPLY: svgIcon(GLYPH.check),
            STICKER_BUTTON: svgIcon('<path d="M15 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v7z"/><path d="M15 21v-2.5a3.5 3.5 0 0 1 3.5-3.5H21"/><path d="M8.5 13.5a4.5 4.5 0 0 0 6 .5"/><path d="M9 9h.01M15 9h.01" stroke-width="2.6"/>'),
            LOADING: svgIcon('<path d="M21 12a9 9 0 1 1-6.2-8.6"/>', 22).replace('<svg ', '<svg class="spin" '),
            RECENT: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>', 18),
            ADD_PACK: svgIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>', 18),
            ZIP_PACK: svgIcon('<path d="M4 8h16v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z"/><path d="M3 4.5h18V8H3z"/><path d="M10 12h4"/>', 18),
            ADD: svgIcon('<path d="M12 5v14M5 12h14"/>', 24),
            EDIT: svgIcon('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', 14),
            DELETE: svgIcon(GLYPH.close, 12),
            CHECK: svgIcon(GLYPH.check, 16, '#fff'),
            TRASH: svgIcon('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>', 16, '#fff'),
            EMPTY_PACK: svgIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke-dasharray="2.5 2.5" opacity=".5"/>', 18),
            UPDATE: svgIcon('<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5"/><path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15"/>', 14),
            badge: function (size) {
                if (!document.getElementById('vp-badge-defs')) {
                    const holder = document.createElement('div');
                    holder.innerHTML = `<svg id="vp-badge-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
        <defs>
            <filter id="vp-badge-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2"/>
            </filter>
            <pattern id="vp-badge-rainbow" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <g filter="url(#vp-badge-blur)">
                <circle cx="4" cy="5" r="6" fill="#ff0044" opacity="1">
                <animate attributeName="cx" values="4;8;4" dur="6s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="5;3;5" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6;7;6" dur="7s" repeatCount="indefinite"/>
                </circle>
                <circle cx="16" cy="7" r="6" fill="#ff8800" opacity="1">
                <animate attributeName="cx" values="16;12;16" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="7;9;7" dur="6s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6;5;6" dur="5.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="8" cy="16" r="6.5" fill="#ffee00" opacity="1">
                <animate attributeName="cx" values="8;10;8" dur="7s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="16;14;16" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6.5;7.5;6.5" dur="4.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="20" cy="14" r="5.5" fill="#00ff44" opacity="1">
                <animate attributeName="cx" values="20;17;20" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="14;16;14" dur="5.5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="5.5;6.5;5.5" dur="6s" repeatCount="indefinite"/>
                </circle>
                <circle cx="3" cy="18" r="5" fill="#00ffff" opacity="1">
                <animate attributeName="cx" values="3;6;3" dur="5.5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="18;16;18" dur="6.5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="5;6;5" dur="5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="12" cy="3" r="5.5" fill="#2288ff" opacity="1">
                <animate attributeName="cx" values="12;9;12" dur="6.5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="3;6;3" dur="4.5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="5.5;6.5;5.5" dur="5.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="21" cy="20" r="6" fill="#aa44ff" opacity="1">
                <animate attributeName="cx" values="21;18;21" dur="4.5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="20;18;20" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6;5;6" dur="6s" repeatCount="indefinite"/>
                </circle>
                <circle cx="6" cy="9" r="4.5" fill="#ff0088" opacity="1">
                <animate attributeName="cx" values="6;9;6" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="9;7;9" dur="6s" repeatCount="indefinite"/>
                <animate attributeName="r" values="4.5;5.5;4.5" dur="4s" repeatCount="indefinite"/>
                </circle>
            </g>
            </pattern>
        </defs>
        </svg>`;
                    document.body.appendChild(holder.firstElementChild);
                }
                return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.8 1.8 20.4 20.4" fill="none">
        <path fill="url(#vp-badge-rainbow)" fill-rule="evenodd" clip-rule="evenodd" d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027Z"/>
        <path fill="black" d="M16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z"/>
        </svg>`;
            }
        };

