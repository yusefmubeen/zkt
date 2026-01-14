"use client"

import type React from "react"
import { Info, Gem, Scale, FileText, HandCoins, HelpCircle } from "lucide-react"
import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Wallet,
  Landmark,
  Banknote,
  CreditCard,
  Briefcase,
  Home,
  BarChart3,
  Coins,
  TrendingUp,
  Calculator,
  Cuboid,
} from "lucide-react"

const ZAKAT_RATE = 0.025 // 2.5%
const AMANA_RATE = 0.1 // 10%
const NISAB_GOLD_GRAMS = 87.48 // grams of gold
const NISAB_SILVER_GRAMS = 612.36 // grams of silver
const GOLD_PRICE_PER_GRAM = 550 // approximate DKK per gram
const SILVER_PRICE_PER_GRAM = 7 // approximate DKK per gram

function formatInputValue(value: string): string {
  // Remove all non-digit characters except comma and minus
  const cleanValue = value.replace(/[^\d,-]/g, "")

  // Split by comma to handle decimals
  const parts = cleanValue.split(",")
  const integerPart = parts[0] || ""
  const decimalPart = parts[1]

  // Remove existing dots and format with thousand separators
  const digits = integerPart.replace(/\./g, "")
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  // Return with decimal part if exists
  if (decimalPart !== undefined) {
    return `${formatted},${decimalPart}`
  }
  return formatted
}

function HandHeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Hand */}
      <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <path d="M7 20l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="M2 15l6 6" />
      {/* Heart */}
      <path d="M19.5 8.5c.7-1 1-2.5.5-4-1.5-1-3-.5-4 .5-1-1-2.5-1.5-4-.5-.5 1.5 0 3 .5 4l3.5 4 3.5-4z" />
    </svg>
  )
}

export function ZakatCalculator() {
  const [nisabType, setNisabType] = useState<"silver" | "gold">("silver")
  const [stockTreatment, setStockTreatment] = useState<"amana" | "cash">("amana")
  const [helpOpen, setHelpOpen] = useState(false)
  const [assets, setAssets] = useState({
    cash: "",
    bankAccounts: "",
    gold: "",
    silver: "",
    stocks: "",
    stockGains: "",
    businessInventory: "",
    propertyInvestment: "",
    otherInvestments: "",
    receivables: "",
  })

  const [liabilities, setLiabilities] = useState({
    debts: "",
    loans: "",
    otherLiabilities: "",
  })

  const [calculated, setCalculated] = useState(false)

  const parseValue = (value: string) => {
    const cleanValue = value
      .replace(/\./g, "") // Remove thousand separators (dots)
      .replace(",", ".") // Replace decimal separator (comma) with dot
    const parsed = Number.parseFloat(cleanValue)
    return isNaN(parsed) ? 0 : parsed
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const nisabThreshold =
    nisabType === "silver" ? NISAB_SILVER_GRAMS * SILVER_PRICE_PER_GRAM : NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM

  const calculations = useMemo(() => {
    const stocksValue = parseValue(assets.stocks)
    const stockGainsValue = parseValue(assets.stockGains)

    const assetsWithoutStocks = Object.entries(assets)
      .filter(([key]) => key !== "stocks" && key !== "stockGains")
      .reduce((sum, [, val]) => sum + parseValue(val), 0)

    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + parseValue(val), 0)

    let stockZakat = 0
    const totalAssetsForDisplay = assetsWithoutStocks + stocksValue

    if (stockTreatment === "cash") {
      const netWorthWithStocks = assetsWithoutStocks + stocksValue - totalLiabilities
      stockZakat = stocksValue * ZAKAT_RATE
    } else {
      stockZakat = stockGainsValue > 0 ? stockGainsValue * AMANA_RATE : 0
    }

    const netWorth = assetsWithoutStocks + stocksValue - totalLiabilities
    const baseZakat = netWorth >= nisabThreshold ? (assetsWithoutStocks - totalLiabilities) * ZAKAT_RATE : 0
    const zakatDue = netWorth >= nisabThreshold ? Math.max(0, baseZakat + stockZakat) : 0

    return {
      totalAssets: totalAssetsForDisplay,
      totalLiabilities,
      netWorth,
      zakatDue,
      stockZakat,
      meetsNisab: netWorth >= nisabThreshold,
    }
  }, [assets, liabilities, nisabThreshold, stockTreatment])

  const handleAssetChange = (field: keyof typeof assets, value: string) => {
    setAssets((prev) => ({ ...prev, [field]: value }))
  }

  const handleLiabilityChange = (field: keyof typeof liabilities, value: string) => {
    setLiabilities((prev) => ({ ...prev, [field]: value }))
  }

  const handleCalculate = () => {
    setCalculated(true)
  }

  const handleReset = () => {
    setAssets({
      cash: "",
      bankAccounts: "",
      gold: "",
      silver: "",
      stocks: "",
      stockGains: "",
      businessInventory: "",
      propertyInvestment: "",
      otherInvestments: "",
      receivables: "",
    })
    setLiabilities({
      debts: "",
      loans: "",
      otherLiabilities: "",
    })
    setCalculated(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Help link in top right corner */}
      <div className="flex justify-end mb-4">
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Hjælp
            </Button>
          </DialogTrigger>
          <DialogContent
            variant="bottomSheet"
            className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Ofte stillede spørgsmål</DialogTitle>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Hvad er zakat?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Zakat er en af de fem søjler i islam og er en obligatorisk velgørenhedsafgift for muslimer. Det er en
                  årlig betaling på 2,5% af ens formue over nisab-tærsklen, som gives til dem i nød.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Hvad er nisab?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Nisab er den minimale formue, man skal have, før zakat bliver obligatorisk. Nisab kan beregnes baseret
                  på enten guld (87,48g) eller sølv (612,36g). Sølv-nisab anbefales, da den resulterer i en lavere
                  tærskel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Hvad er forskellen på Amana-metoden og Kontant-metoden?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  <strong>Amana-metoden:</strong> Betragter aktier som "produktiv kapital" (som afgrøder). Du betaler
                  10% zakat kun af årets gevinst.
                  <br />
                  <br />
                  <strong>Kontant-metoden:</strong> Betragter aktier som kontanter. Du betaler 2,5% zakat af den samlede
                  værdi af dine aktier.
                  <br />
                  <br />
                  Amana-metoden anbefales af mange lærde.{" "}
                  <a
                    href="https://halal.ninja/zakat-on-stocks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 underline"
                  >
                    Læs mere
                  </a>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Skal jeg betale zakat af min bolig?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Nej, du skal ikke betale zakat af din primære bolig, som du bor i. Du skal kun betale zakat af
                  investeringsejendomme, som er købt med henblik på udlejning eller salg.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Hvornår skal jeg betale zakat?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Zakat skal betales én gang om året. Mange muslimer vælger at betale i Ramadan, men du kan vælge enhver
                  dato som din årlige zakat-dato. Det vigtige er, at du er konsekvent og betaler hvert år på samme tid.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Hvem kan modtage zakat?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Koranen nævner otte kategorier af modtagere: de fattige, de nødlidende, zakat-administratorer, nye
                  muslimer, slaver (for at frigøre dem), gældsatte, i Allahs vej, og vejfarende. I dag gives zakat
                  typisk til fattige og nødlidende gennem velgørenhedsorganisationer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7" className="border-gray-800">
                <AccordionTrigger className="text-gray-200 hover:text-white cursor-pointer">
                  Er denne beregner 100% nøjagtig?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Denne beregner giver et estimat baseret på de oplysninger, du indtaster. For specifikke spørgsmål om
                  din situation, anbefales det at konsultere en kvalificeret islamisk lærd. Guld- og sølvpriser kan
                  variere, så tjek aktuelle priser for den mest nøjagtige beregning.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </DialogContent>
        </Dialog>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-800/20 rounded-full mb-4">
          <HandHeartIcon className="w-8 h-8 text-green-700" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 text-balance">Zakat-beregner</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-pretty">
          Beregn din årlige zakat (islamisk velgørenhed) baseret på dine aktiver og gæld. Zakat er 2,5% af din formue
          over nisab-tærsklen.
        </p>
      </div>

      {/* Nisab Info */}
      <Card className="mb-8 border-green-800/30 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Scale className="w-5 h-5 text-green-600" />
            Nisab-tærskel
          </CardTitle>
          <CardDescription className="text-gray-400">
            Den nuværende nisab-tærskel er cirka{" "}
            <span className="font-semibold text-white">{formatCurrency(nisabThreshold)}</span> (baseret på{" "}
            {nisabType === "silver" ? "612,36g sølv" : "87,48g guld"}). Du skal kun betale zakat, hvis din nettoformue
            overstiger denne grænse.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-medium text-gray-300">Vælg nisab-beregningsmetode</Label>
              <Popover>
                <PopoverTrigger className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2 text-gray-500 hover:text-gray-300 active:text-gray-300 touch-manipulation cursor-pointer">
                  <Info className="w-4 h-4" />
                  <span className="sr-only">Info om nisab-beregningsmetode</span>
                </PopoverTrigger>
                <PopoverContent side="top" className="max-w-xs text-sm bg-gray-800 border-gray-700 text-gray-300">
                  Sølv anbefales, da det resulterer i en lavere nisab-tærskel, hvilket betyder at flere mennesker
                  kvalificerer til at betale zakat.
                </PopoverContent>
              </Popover>
            </div>
            <RadioGroup
              value={nisabType}
              onValueChange={(value) => setNisabType(value as "silver" | "gold")}
              className="flex flex-col md:flex-row gap-4"
            >
              <label
                htmlFor="silver"
                className="flex items-start space-x-3 bg-gray-800 rounded-lg p-3 border border-gray-500 hover:border-green-700 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/50 transition-colors cursor-pointer w-full flex-1"
              >
                <RadioGroupItem value="silver" id="silver" className="border-gray-500 text-green-600 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-gray-300 font-medium">
                    <Gem className="w-4 h-4 text-gray-400" />
                    Sølv
                    <Badge className="text-xs bg-green-800/30 text-green-500 border-0 px-2 py-0.5">Anbefalet</Badge>
                  </span>
                  <span className="text-sm text-gray-500">Baseret på 612,36g sølv</span>
                </div>
              </label>
              <label
                htmlFor="gold"
                className="flex items-start space-x-3 bg-gray-800 rounded-lg p-3 border border-gray-500 hover:border-green-700 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/50 transition-colors cursor-pointer w-full flex-1"
              >
                <RadioGroupItem value="gold" id="gold" className="border-gray-500 text-green-600 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-gray-300 font-medium">
                    <Cuboid className="w-4 h-4 text-gray-400" />
                    Guld
                  </span>
                  <span className="text-sm text-gray-500">Baseret på 87,48g guld</span>
                </div>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Stock Treatment Section */}
      <Card className="mb-8 border-green-800/30 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Aktier og investeringer
          </CardTitle>
          <CardDescription className="text-gray-400">
            Vælg hvordan zakat på dine aktier og investeringer skal beregnes.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-medium text-gray-300">Vælg beregningsmetode</Label>
              <Popover>
                <PopoverTrigger className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2 text-gray-500 hover:text-gray-300 active:text-gray-300 touch-manipulation cursor-pointer">
                  <Info className="w-4 h-4" />
                  <span className="sr-only">Info om beregningsmetode for aktier og investeringer</span>
                </PopoverTrigger>
                <PopoverContent side="top" className="max-w-xs text-sm bg-gray-800 border-gray-700 text-gray-300">
                  Amana-metoden anbefales, da aktier og investeringer betragtes som "produktiv kapital" på linje med
                  afgrøder fra jorden. Zakat betales derfor kun af gevinsten (10%), ikke af selve kapitalen.{" "}
                  <a
                    href="https://halal.ninja/zakat-on-stocks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-500 underline"
                  >
                    Læs mere
                  </a>
                </PopoverContent>
              </Popover>
            </div>
            <RadioGroup
              value={stockTreatment}
              onValueChange={(value) => setStockTreatment(value as "amana" | "cash")}
              className="flex flex-col md:flex-row gap-4"
            >
              <label
                htmlFor="amana"
                className="flex items-start space-x-3 bg-gray-800 rounded-lg p-3 border border-gray-500 hover:border-green-700 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/50 transition-colors cursor-pointer w-full flex-1"
              >
                <RadioGroupItem value="amana" id="amana" className="border-gray-500 text-green-600 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-gray-300 font-medium">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    Amana-metoden
                    <Badge className="text-xs bg-green-800/30 text-green-500 border-0 px-2 py-0.5">Anbefalet</Badge>
                  </span>
                  <span className="text-sm text-gray-500">10% zakat på årets gevinst</span>
                </div>
              </label>
              <label
                htmlFor="cash"
                className="flex items-start space-x-3 bg-gray-800 rounded-lg p-3 border border-gray-500 hover:border-green-700 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/50 transition-colors cursor-pointer w-full flex-1"
              >
                <RadioGroupItem value="cash" id="cash" className="border-gray-500 text-green-600 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-gray-300 font-medium">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    Kontant-metoden
                  </span>
                  <span className="text-sm text-gray-500">2,5% zakat på den samlede værdi</span>
                </div>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Assets Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-green-600" />
              Aktiver
            </CardTitle>
            <CardDescription className="text-gray-400">Indtast værdien af dine aktiver i DKK</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AssetInput
              label="Bankkonti"
              value={formatInputValue(assets.bankAccounts)}
              onChange={(v) => handleAssetChange("bankAccounts", v)}
              icon={<Landmark className="w-4 h-4" />}
              tooltip="Saldo på alle bankkonti (opsparing, løn, etc.)"
            />
            <AssetInput
              label="Fysiske kontanter"
              value={formatInputValue(assets.cash)}
              onChange={(v) => handleAssetChange("cash", v)}
              icon={<Banknote className="w-4 h-4" />}
              tooltip="Kontanter du har hjemme eller i pengeskab"
            />
            <AssetInput
              label="Guld"
              value={formatInputValue(assets.gold)}
              onChange={(v) => handleAssetChange("gold", v)}
              icon={<Cuboid className="w-4 h-4" />}
              tooltip="Værdi af guld smykker og guldbarrer"
            />
            <AssetInput
              label="Sølv"
              value={formatInputValue(assets.silver)}
              onChange={(v) => handleAssetChange("silver", v)}
              icon={<Gem className="w-4 h-4" />}
              tooltip="Værdi af sølv smykker og sølvbarrer"
            />
            <AssetInput
              label="Forretningsinventar"
              value={formatInputValue(assets.businessInventory)}
              onChange={(v) => handleAssetChange("businessInventory", v)}
              icon={<Briefcase className="w-4 h-4" />}
              tooltip="Værdi af varer til salg i din virksomhed"
            />
            <AssetInput
              label="Investeringsejendomme"
              value={formatInputValue(assets.propertyInvestment)}
              onChange={(v) => handleAssetChange("propertyInvestment", v)}
              icon={<Home className="w-4 h-4" />}
              tooltip="Ejendomme købt med henblik på udlejning eller salg"
            />
            <AssetInput
              label="Aktier og værdipapirer"
              value={formatInputValue(assets.stocks)}
              onChange={(v) => handleAssetChange("stocks", v)}
              icon={<BarChart3 className="w-4 h-4" />}
              tooltip="Samlet værdi af aktier, obligationer, fonde og andre værdipapirer"
            />
            <AssetInput
              label="Andre investeringer"
              value={formatInputValue(assets.otherInvestments)}
              onChange={(v) => handleAssetChange("otherInvestments", v)}
              icon={<Coins className="w-4 h-4" />}
              tooltip="Kryptovaluta, pensionsopsparing, etc."
            />
            {stockTreatment === "amana" && (
              <AssetInput
                label="Afkast på aktier og investeringer"
                value={formatInputValue(assets.stockGains)}
                onChange={(v) => handleAssetChange("stockGains", v)}
                icon={<TrendingUp className="w-4 h-4" />}
                tooltip="Årets gevinst på aktier og investeringer. Hvis du har haft tab, indtast 0."
              />
            )}
            <AssetInput
              label="Tilgodehavender"
              value={formatInputValue(assets.receivables)}
              onChange={(v) => handleAssetChange("receivables", v)}
              icon={<HandCoins className="w-4 h-4" />}
              tooltip="Penge som andre skylder dig og som du forventer at modtage"
            />
          </CardContent>
        </Card>

        {/* Liabilities Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="w-5 h-5 text-green-600" />
              Gæld
            </CardTitle>
            <CardDescription className="text-gray-400">Indtast din gæld og forpligtelser i DKK</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AssetInput
              label="Kortfristet gæld"
              value={formatInputValue(liabilities.debts)}
              onChange={(v) => handleLiabilityChange("debts", v)}
              icon={<CreditCard className="w-4 h-4" />}
              tooltip="Gæld der forfalder inden for et år (kreditkort, regninger)"
            />
            <AssetInput
              label="Lån"
              value={formatInputValue(liabilities.loans)}
              onChange={(v) => handleLiabilityChange("loans", v)}
              icon={<Landmark className="w-4 h-4" />}
              tooltip="Årligt afdrag på boliglån, billån, studielån, etc."
            />
            <AssetInput
              label="Andre forpligtelser"
              value={formatInputValue(liabilities.otherLiabilities)}
              onChange={(v) => handleLiabilityChange("otherLiabilities", v)}
              icon={<FileText className="w-4 h-4" />}
              tooltip="Andre økonomiske forpligtelser"
            />
          </CardContent>
        </Card>
      </div>

      {/* Calculate Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Button
          size="lg"
          onClick={handleCalculate}
          className="bg-green-800 text-white hover:bg-green-900 px-8 cursor-pointer"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Beregn zakat
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReset}
          className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent cursor-pointer"
        >
          Nulstil
        </Button>
      </div>

      {/* Results Section */}
      {calculated && (
        <Card className="mt-8 border-2 border-green-800 bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl text-white">Beregningsresultat</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ResultItem label="Samlede aktiver" value={formatCurrency(calculations.totalAssets)} />
              <ResultItem label="Samlet gæld" value={formatCurrency(calculations.totalLiabilities)} />
              <ResultItem
                label="Nettoformue"
                value={formatCurrency(calculations.netWorth)}
                highlight={calculations.meetsNisab}
              />
              <ResultItem label="Zakat at betale" value={formatCurrency(calculations.zakatDue)} primary />
            </div>

            <Separator className="my-6 bg-gray-800" />

            <div className="text-center">
              {calculations.meetsNisab ? (
                <div className="bg-green-800/20 rounded-lg p-4 border border-green-800/30">
                  <p className="text-lg font-semibold text-white mb-2">
                    Din zakat for i år er{" "}
                    <span className="text-green-500">{formatCurrency(calculations.zakatDue)}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    {stockTreatment === "amana" ? (
                      <>
                        Beregnet med 2,5% på øvrige aktiver og 10% på aktiegevinst (
                        {formatCurrency(calculations.stockZakat)})
                      </>
                    ) : (
                      <>Dette beløb er 2,5% af din nettoformue på {formatCurrency(calculations.netWorth)}</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-lg font-semibold text-white mb-2">Du skal ikke betale zakat i år</p>
                  <p className="text-sm text-gray-400">
                    Din nettoformue ({formatCurrency(calculations.netWorth)}) er under nisab-tærsklen (
                    {formatCurrency(nisabThreshold)})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>
          Denne beregner er kun vejledende. Konsulter venligst en kvalificeret islamisk lærd for præcis vejledning om
          zakat.
        </p>
      </footer>
    </div>
  )
}

function AssetInput({
  label,
  value,
  onChange,
  icon,
  tooltip,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  icon: React.ReactNode
  tooltip: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label className="text-sm font-medium flex items-center gap-2 text-gray-300">
          {icon}
          {label}
        </Label>
        <Popover>
          <PopoverTrigger className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2 text-gray-500 hover:text-gray-300 active:text-gray-300 touch-manipulation cursor-pointer">
            <Info className="w-4 h-4" />
            <span className="sr-only">Info om {label}</span>
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-xs text-sm bg-gray-800 border-gray-700 text-gray-300">
            {tooltip}
          </PopoverContent>
        </Popover>
      </div>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-700 focus:ring-green-700"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">DKK</span>
      </div>
    </div>
  )
}

function ResultItem({
  label,
  value,
  highlight = false,
  primary = false,
}: {
  label: string
  value: string
  highlight?: boolean
  primary?: boolean
}) {
  return (
    <div
      className={`text-center p-4 rounded-lg ${
        primary ? "bg-green-800 text-white" : highlight ? "bg-green-800/20 border border-green-800/30" : "bg-gray-800"
      }`}
    >
      <p className={`text-sm mb-1 ${primary ? "text-green-100" : "text-gray-400"}`}>{label}</p>
      <p className={`text-xl font-bold text-white`}>{value}</p>
    </div>
  )
}
