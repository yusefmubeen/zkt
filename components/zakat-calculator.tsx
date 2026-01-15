"use client"
import { Info, HelpCircle, Loader2 } from "lucide-react"
import { useState, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calculator } from "lucide-react"

const ZAKAT_RATE = 0.025 // 2.5%
const AMANA_RATE = 0.1 // 10%
const QUARTER_RATE = 0.25 // 25% of stock value
const NISAB_GOLD_GRAMS = 87.48 // grams of gold
const NISAB_SILVER_GRAMS = 612.36 // grams of silver
const GOLD_PRICE_PER_GRAM = 550 // approximate DKK per gram
const SILVER_PRICE_PER_GRAM = 7 // approximate DKK per gram

function formatInputValue(value: string): string {
  const cleanValue = value.replace(/[^\d,-]/g, "")
  const parts = cleanValue.split(",")
  const integerPart = parts[0] || ""
  const decimalPart = parts[1]
  const digits = integerPart.replace(/\./g, "")
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
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
      <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <path d="M7 20l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="M2 15l6 6" />
      <path d="M19.5 8.5c.7-1 1-2.5.5-4-1.5-1-3-.5-4 .5-1-1-2.5-1.5-4-.5-.5 1.5 0 3 .5 4l3.5 4 3.5-4z" />
    </svg>
  )
}

export function ZakatCalculator() {
  const [nisabType, setNisabType] = useState<"silver" | "gold">("silver")
  const [stockTreatment, setStockTreatment] = useState<"quarter" | "amana" | "cash">("quarter")
  const [helpOpen, setHelpOpen] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)
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
    const cleanValue = value.replace(/\./g, "").replace(",", ".")
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
    const cryptoValue = parseValue(assets.otherInvestments)

    const assetsWithoutStocksAndCrypto = Object.entries(assets)
      .filter(([key]) => key !== "stocks" && key !== "stockGains" && key !== "otherInvestments")
      .reduce((sum, [, val]) => sum + parseValue(val), 0)

    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + parseValue(val), 0)

    let stockZakat = 0
    const totalAssetsForDisplay = assetsWithoutStocksAndCrypto + stocksValue + cryptoValue

    if (stockTreatment === "cash") {
      stockZakat = stocksValue * ZAKAT_RATE
    } else if (stockTreatment === "quarter") {
      stockZakat = stocksValue * QUARTER_RATE * ZAKAT_RATE
    } else {
      stockZakat = stockGainsValue > 0 ? stockGainsValue * AMANA_RATE : 0
    }

    const netWorth = assetsWithoutStocksAndCrypto + stocksValue + cryptoValue - totalLiabilities
    const baseZakat =
      netWorth >= nisabThreshold ? (assetsWithoutStocksAndCrypto + cryptoValue - totalLiabilities) * ZAKAT_RATE : 0
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
    setIsCalculating(true)
    setCalculated(false)

    setTimeout(() => {
      setCalculated(true)
      setIsCalculating(false)

      // Scroll to results after a short delay to allow render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }, 800)
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Help link */}
      <div className="flex justify-end mb-4">
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
              <HelpCircle className="w-4 h-4 mr-1" />
              Hjælp
            </Button>
          </DialogTrigger>
          <DialogContent variant="bottomSheet" className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ofte stillede spørgsmål</DialogTitle>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="cursor-pointer">Hvad er zakat?</AccordionTrigger>
                <AccordionContent>
                  Zakat er en af de fem søjler i islam og er en obligatorisk velgørenhedsafgift for muslimer. Det er en
                  årlig betaling på 2,5% af ens formue over nisab-tærsklen, som gives til dem i nød.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="cursor-pointer">Hvad er nisab?</AccordionTrigger>
                <AccordionContent>
                  Nisab er den minimale formue, man skal have, før zakat bliver obligatorisk. Nisab kan beregnes baseret
                  på enten guld (87,48g) eller sølv (612,36g). Sølv-nisab anbefales, da den resulterer i en lavere
                  tærskel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="cursor-pointer">
                  Hvad er forskellen på Kvart-, Kontant- og Amana-metoden?
                </AccordionTrigger>
                <AccordionContent>
                  <span className="font-semibold">Kvart-metoden (anbefalet):</span> Du betaler 2,5% zakat på kun 25% af
                  din aktie- og værdipapirbeholdning. Denne metode tager højde for, at en stor del af aktieværdien
                  typisk er bundet i virksomhedens faste aktiver.
                  <br />
                  <br />
                  <span className="font-semibold">Kontant-metoden:</span> Betragter aktier som kontanter. Du betaler
                  2,5% zakat af den samlede værdi af dine aktier.
                  <br />
                  <br />
                  <span className="font-semibold">Amana-metoden:</span> Betragter aktier som "produktiv kapital" (som
                  afgrøder). Du betaler 10% zakat kun af årets afkast.
                  <br />
                  <br />
                  Kvart-metoden anbefales som en balanceret tilgang.{" "}
                  <a
                    href="https://halal.ninja/zakat-on-stocks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Læs mere om zakat på aktier
                  </a>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="cursor-pointer">Skal jeg betale zakat af min bolig?</AccordionTrigger>
                <AccordionContent>
                  Nej, du skal ikke betale zakat af din primære bolig, som du bor i. Du skal kun betale zakat af
                  investeringsejendomme, som er købt med henblik på udlejning eller salg.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="cursor-pointer">Hvornår skal jeg betale zakat?</AccordionTrigger>
                <AccordionContent>
                  Zakat skal betales én gang om året. Mange muslimer vælger at betale i Ramadan, men du kan vælge enhver
                  dato som din årlige zakat-dato. Det vigtige er, at du er konsekvent og betaler hvert år på samme tid.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger className="cursor-pointer">Hvem kan modtage zakat?</AccordionTrigger>
                <AccordionContent>
                  Koranen nævner otte kategorier af modtagere: de fattige, de nødlidende, zakat-administratorer, nye
                  muslimer, slaver (for at frigøre dem), gældsatte, i Allahs vej, og vejfarende. I dag gives zakat
                  typisk til fattige og nødlidende gennem velgørenhedsorganisationer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7">
                <AccordionTrigger className="cursor-pointer">Er denne beregner 100% nøjagtig?</AccordionTrigger>
                <AccordionContent>
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <HandHeartIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Zakat-beregner</h1>
        <p className="text-sm text-muted-foreground">Beregn din årlige zakat baseret på dine aktiver og gæld.</p>
      </div>

      {/* Nisab Section */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-2">Nisab</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Den nuværende nisab-tærskel er cirka{" "}
          <span className="font-semibold text-foreground">{formatCurrency(nisabThreshold)}</span> (baseret på{" "}
          {nisabType === "silver" ? "612,36g sølv" : "87,48g guld"}). Du skal kun betale zakat, hvis din nettoformue
          overstiger denne grænse.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <Label className="text-sm">Vælg beregningsmetode</Label>
            <Popover>
              <PopoverTrigger className="text-muted-foreground hover:text-foreground cursor-pointer">
                <Info className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent side="top" className="max-w-xs text-sm">
                Sølv anbefales, da det resulterer i en lavere nisab-tærskel, hvilket betyder at flere mennesker
                kvalificerer til at betale zakat.
              </PopoverContent>
            </Popover>
          </div>
          <RadioGroup
            value={nisabType}
            onValueChange={(value) => setNisabType(value as "silver" | "gold")}
            className="flex flex-col sm:flex-row gap-3"
          >
            <label htmlFor="silver" className="flex items-center gap-3 rounded-md border p-3 cursor-pointer flex-1">
              <RadioGroupItem value="silver" id="silver" />
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  Sølv
                  <Badge variant="secondary">Anbefalet</Badge>
                </span>
                <span className="text-sm text-muted-foreground">Baseret på 612,36g sølv</span>
              </div>
            </label>
            <label htmlFor="gold" className="flex items-center gap-3 rounded-md border p-3 cursor-pointer flex-1">
              <RadioGroupItem value="gold" id="gold" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Guld</span>
                <span className="text-sm text-muted-foreground">Baseret på 87,48g guld</span>
              </div>
            </label>
          </RadioGroup>
        </div>
      </section>

      {/* Assets Section */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-2">Aktiver</h2>
        <p className="text-sm text-muted-foreground mb-4">Indtast værdien af dine aktiver i DKK</p>
        <div className="space-y-6">
          <AssetInput
            label="Bankkonti"
            value={formatInputValue(assets.bankAccounts)}
            onChange={(v) => handleAssetChange("bankAccounts", v)}
            tooltip="Saldo på alle bankkonti (opsparing, løn, etc.)"
          />
          <AssetInput
            label="Fysiske kontanter"
            value={formatInputValue(assets.cash)}
            onChange={(v) => handleAssetChange("cash", v)}
            tooltip="Kontanter du har hjemme eller i pengeskab"
          />
          <AssetInput
            label="Guld"
            value={formatInputValue(assets.gold)}
            onChange={(v) => handleAssetChange("gold", v)}
            tooltip="Værdi af guld smykker og guldbarrer"
          />
          <AssetInput
            label="Sølv"
            value={formatInputValue(assets.silver)}
            onChange={(v) => handleAssetChange("silver", v)}
            tooltip="Værdi af sølv smykker og sølvbarrer"
          />
          <AssetInput
            label="Forretningsinventar"
            value={formatInputValue(assets.businessInventory)}
            onChange={(v) => handleAssetChange("businessInventory", v)}
            tooltip="Værdi af varer til salg i din virksomhed"
          />
          <AssetInput
            label="Investeringsejendomme"
            value={formatInputValue(assets.propertyInvestment)}
            onChange={(v) => handleAssetChange("propertyInvestment", v)}
            tooltip="Ejendomme købt med henblik på udlejning eller salg"
          />
          <AssetInput
            label="Aktier og værdipapirer"
            value={formatInputValue(assets.stocks)}
            onChange={(v) => handleAssetChange("stocks", v)}
            tooltip="Samlet værdi af aktier, obligationer, fonde og andre værdipapirer"
          />
          <AssetInput
            label="Kryptovaluta"
            value={formatInputValue(assets.otherInvestments)}
            onChange={(v) => handleAssetChange("otherInvestments", v)}
            tooltip="Bitcoin og andre kryptovalutaer"
          />
          <AssetInput
            label="Tilgodehavender"
            value={formatInputValue(assets.receivables)}
            onChange={(v) => handleAssetChange("receivables", v)}
            tooltip="Penge som andre skylder dig og som du forventer at modtage"
          />
        </div>
      </section>

      {/* Liabilities Section */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-2">Gæld</h2>
        <p className="text-sm text-muted-foreground mb-4">Indtast din gæld og forpligtelser i DKK</p>
        <div className="space-y-6">
          <AssetInput
            label="Personlige lån"
            value={formatInputValue(liabilities.debts)}
            onChange={(v) => handleLiabilityChange("debts", v)}
            tooltip="Lån fra familie, venner eller andre"
          />
          <AssetInput
            label="Banklån og kreditkort"
            value={formatInputValue(liabilities.loans)}
            onChange={(v) => handleLiabilityChange("loans", v)}
            tooltip="Udestående lån og kreditkortgæld, der forfalder inden for et år"
          />
          <AssetInput
            label="Andre forpligtelser"
            value={formatInputValue(liabilities.otherLiabilities)}
            onChange={(v) => handleLiabilityChange("otherLiabilities", v)}
            tooltip="Andre økonomiske forpligtelser"
          />
        </div>
      </section>

      {/* Stock Treatment Section */}
      {parseValue(assets.stocks) > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-2">Beregningsmetode for aktier</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Vælg hvordan zakat på dine aktier og værdipapirer skal beregnes.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label className="text-sm">Vælg beregningsmetode</Label>
              <Popover>
                <PopoverTrigger className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <Info className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent side="top" className="max-w-xs text-sm">
                  Der er forskellige holdninger til, hvordan zakat på aktier og værdipapirer skal beregnes.
                  Kvart-metoden (2,5% på 25%) anbefales som en balanceret tilgang.{" "}
                  <a
                    href="https://halal.ninja/zakat-on-stocks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Læs mere
                  </a>
                </PopoverContent>
              </Popover>
            </div>
            <RadioGroup
              value={stockTreatment}
              onValueChange={(value) => setStockTreatment(value as "quarter" | "amana" | "cash")}
              className="flex flex-col gap-3"
            >
              <label htmlFor="quarter" className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="quarter" id="quarter" />
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    Kvart-metoden
                    <Badge variant="secondary">Anbefalet</Badge>
                  </span>
                  <span className="text-sm text-muted-foreground">2,5% zakat på 25% af aktiebeholdningen</span>
                </div>
              </label>
              <label htmlFor="cash" className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Kontant-metoden</span>
                  <span className="text-sm text-muted-foreground">2,5% zakat på den samlede aktieværdi</span>
                </div>
              </label>
              <label htmlFor="amana" className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="amana" id="amana" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Amana-metoden</span>
                  <span className="text-sm text-muted-foreground">10% zakat kun på årets afkast</span>
                </div>
              </label>
            </RadioGroup>
            {stockTreatment === "amana" && (
              <div className="mt-4">
                <AssetInput
                  label="Afkast på aktier og værdipapirer"
                  value={formatInputValue(assets.stockGains)}
                  onChange={(v) => handleAssetChange("stockGains", v)}
                  tooltip="Din samlede gevinst fra aktier og værdipapirer for året. Indtast 0, hvis du har haft tab."
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Calculate Button */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Button
          size="lg"
          onClick={handleCalculate}
          className="bg-lime-700 hover:bg-lime-800 text-white cursor-pointer"
          disabled={isCalculating}
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Beregner...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2" />
              Beregn zakat
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReset}
          disabled={isCalculating}
          className="cursor-pointer bg-transparent"
        >
          Nulstil
        </Button>
      </div>

      {/* Results Section */}
      {calculated && (
        <section className="mt-8" ref={resultsRef}>
          <h2 className="text-lg font-semibold mb-4 text-center">Beregningsresultat</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResultItem label="Samlede aktiver" value={formatCurrency(calculations.totalAssets)} />
            <ResultItem label="Samlet gæld" value={formatCurrency(calculations.totalLiabilities)} />
            <ResultItem
              label="Nettoformue"
              value={formatCurrency(calculations.netWorth)}
              highlight={calculations.meetsNisab}
            />
            <ResultItem label="Zakat at betale" value={formatCurrency(calculations.zakatDue)} primary />
          </div>

          <div className="mt-6 text-center">
            {calculations.meetsNisab ? (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-base font-semibold mb-2">
                  Din zakat for i år er <span className="text-primary">{formatCurrency(calculations.zakatDue)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {stockTreatment === "quarter" ? (
                    <>
                      Beregnet med 2,5% på øvrige aktiver og 2,5% på 25% af aktiebeholdningen (
                      {formatCurrency(calculations.stockZakat)})
                    </>
                  ) : stockTreatment === "amana" ? (
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
              <div className="bg-muted rounded-lg p-4">
                <p className="text-base font-semibold mb-2">Du skal ikke betale zakat i år</p>
                <p className="text-sm text-muted-foreground">
                  Din nettoformue ({formatCurrency(calculations.netWorth)}) er under nisab-tærsklen (
                  {formatCurrency(nisabThreshold)})
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
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
  tooltip,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  tooltip: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label className="text-sm">{label}</Label>
        <Popover>
          <PopoverTrigger className="text-muted-foreground hover:text-foreground cursor-pointer">
            <Info className="w-4 h-4" />
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-xs text-sm">
            {tooltip}
          </PopoverContent>
        </Popover>
      </div>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">DKK</span>
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
    <div className={`text-center p-4 rounded-lg ${primary ? "bg-black" : "bg-muted"}`}>
      <p className={`text-sm mb-1 ${primary ? "text-white/80" : "text-muted-foreground"}`}>{label}</p>
      <p className={`text-xl font-semibold ${primary ? "text-white" : ""}`}>{value}</p>
    </div>
  )
}
