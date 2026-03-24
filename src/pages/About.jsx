import React from "react";
import Footer from "../components/Footer";
import { Zap, ShieldCheck, Star, Sparkles, Lightbulb, Target } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">O nas</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Kim jesteśmy?</h2>
          <p className="text-gray-700 mb-4">
            Helpfli to nowoczesna platforma, która łączy klientów z wykwalifikowanymi wykonawcami. 
            Naszym celem jest ułatwienie znalezienia profesjonalnej pomocy w różnych dziedzinach życia.
          </p>
          <p className="text-gray-700">
            Działamy na terenie całej Polski, oferując szybki i bezpieczny sposób na znalezienie 
            odpowiedniego specjalisty dla Twoich potrzeb.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Nasza misja</h2>
          <p className="text-gray-700 mb-4">
            Chcemy, aby każdy mógł łatwo znaleźć profesjonalną pomoc, gdy jej potrzebuje. 
            Dzięki naszej platformie:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Klienci mogą szybko znaleźć sprawdzonych wykonawców</li>
            <li>Wykonawcy mają dostęp do nowych zleceń</li>
            <li>Wszystkie transakcje są bezpieczne i przejrzyste</li>
            <li>System ocen i opinii zapewnia wysoką jakość usług</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Dlaczego Helpfli?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mt-1">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Szybkość</h3>
                <p className="text-gray-700 text-sm">
                  Znajdź wykonawcę w kilka minut dzięki naszemu inteligentnemu systemowi wyszukiwania.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center mt-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Bezpieczeństwo</h3>
                <p className="text-gray-700 text-sm">
                  Wykonawcy są weryfikowani, a Twoje płatności chronione przez system Helpfli.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mt-1">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Jakość</h3>
                <p className="text-gray-700 text-sm">
                  System ocen i opinii pomaga wybrać najlepszych specjalistów w swojej dziedzinie.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center mt-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI Concierge</h3>
                <p className="text-gray-700 text-sm">
                  Nasz asystent AI podpowie zakres prac, widełki ceny i pomoże dobrać wykonawcę.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Nasze wartości</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Zaufanie</h3>
              <p className="text-gray-700 text-sm">
                Budujemy relacje oparte na zaufaniu między klientami a wykonawcami.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Innowacja</h3>
              <p className="text-gray-700 text-sm">
                Wykorzystujemy najnowsze technologie, aby ułatwić Ci życie.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Skuteczność</h3>
              <p className="text-gray-700 text-sm">
                Skupiamy się na dostarczaniu najlepszych rozwiązań dla naszych użytkowników.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Dołącz do nas</h2>
          <p className="text-gray-700 mb-4">
            Czy jesteś klientem szukającym pomocy, czy wykonawcą oferującym swoje usługi - 
            Helpfli to miejsce dla Ciebie!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="/register" 
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Zostań wykonawcą
            </a>
            <a 
              href="/search" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Znajdź wykonawcę
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
