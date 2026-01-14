interface ResultItemProps {
  label: string
  value: string
  highlight?: boolean
  primary?: boolean
}

export function ResultItem({ label, value, highlight, primary }: ResultItemProps) {
  return (
    <div
      className={`text-center p-4 rounded-lg ${primary ? "bg-green-800/20 border border-green-800/30" : "bg-gray-800"}`}
    >
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${primary ? "text-green-500" : highlight ? "text-white" : "text-gray-200"}`}>
        {value}
      </p>
    </div>
  )
}
