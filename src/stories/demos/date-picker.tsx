import { attr, define, h, VNode } from 'js-elements'
import { useState, useStyles } from 'js-elements/hooks'

export default define('date-picker-demo', () => {
  return () => <DatePicker />
})

// === types ========================================================

type DatePickerViewModel = {
  firstDayOfWeek: number
  showWeekNumbers: boolean
  shownYear: number
  shownMonth: number
}

// === DatePicker ====================================================

class DatePickerProps {}

const DatePicker = define('jsc-date-picker', DatePickerProps, (p) => {
  const [s, set] = useState({
    selectedDate: new Date()
  })

  useStyles(datePickerStyles)

  return () => {
    const model: DatePickerViewModel = {
      firstDayOfWeek: 0,
      showWeekNumbers: true,
      shownMonth: 11,
      shownYear: 2020
    }

    return renderCalendar(model)
  }
})

function renderCalendar(model: DatePickerViewModel): VNode {
  const rows: VNode[] = []

  const ret = (
    <table>
      <tbody>{rows}</tbody>
    </table>
  )

  for (let weekIdx = 0; weekIdx < 5; ++weekIdx) {
    const cols: VNode[] = []

    rows.push(<tr>{cols}</tr>)

    for (let dayIdx = 0; dayIdx < 7; ++dayIdx) {
      const dayOfMonth = new Date(model.shownYear, model.shownMonth, 1)

      cols.push(<td>{dayOfMonth}</td>)
    }
  }

  return ret
}

const datePickerStyles = `

`
