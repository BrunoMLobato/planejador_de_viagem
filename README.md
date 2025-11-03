# 🚗 Guia de Viagem Interativo

Aplicação web desenvolvida com **React + Vite + TypeScript** que facilita o planejamento de viagens mostrando rotas, previsão do tempo e recomendações musicais do Spotify.

## 🌟 Funcionalidades

- Busca de rotas entre cidades via Geoapify
- Exibição do mapa da viagem
- Consulta de clima em tempo real pela OpenWeatherMap
- Recomendação de músicas temáticas via Spotify
- Interface responsiva para desktop e mobile

## 🛠️ Tecnologias

- React / ReactDOM
- Vite
- TypeScript
- Geoapify API
- OpenWeatherMap API
- Spotify API

## 📋 Pré-requisitos

- Node.js v18+ instalado
- npm, yarn ou pnpm
- Contas/keys das APIs utilizadas

## 🔑 Configuração das APIs

1. Geoapify: [https://www.geoapify.com/](https://www.geoapify.com/)
2. OpenWeatherMap: [https://openweathermap.org/api](https://openweathermap.org/api)
3. Spotify Dashboard: [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)

## ⚙️ Variáveis de Ambiente

No arquivo `.env` na raiz do projeto, adicione:
- VITE_CLIENT_ID=seu_spotify_client_id
- VITE_CLIENT_SECRET=seu_spotify_client_secret
- VITE_API_KEY=sua_geoapify_key
- VITE_OPENWEATHER_API_KEY=sua_openweather_key

## 🚀 Instalação e Execução
- npm install
- npm run dev


