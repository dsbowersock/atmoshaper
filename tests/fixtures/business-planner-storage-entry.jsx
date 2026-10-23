import React, { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { BreakEvenPlannerClient } from "../../app/tools/business-planner/break-even/break-even-planner-client"
import { AddOnProfitClient } from "../../app/tools/business-planner/add-on-profit/add-on-profit-client"
import { ServiceMenuClient } from "../../app/tools/business-planner/service-menu/service-menu-client"
import { LaunchChecklistClient } from "../../app/tools/business-planner/launch-checklist/launch-checklist-client"
import { PlanOutlineClient } from "../../app/tools/business-planner/plan-outline/plan-outline-client"
import { IncomePlannerClient } from "../../app/tools/business-planner/income/income-planner-client"

const clients = {
  "break-even": BreakEvenPlannerClient,
  "add-on-profit": AddOnProfitClient,
  "service-menu": ServiceMenuClient,
  "launch-checklist": LaunchChecklistClient,
  "plan-outline": PlanOutlineClient,
  income: IncomePlannerClient,
}
const harness = window.__businessPlannerFixture

class Boundary extends React.Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    harness.errors.push(error.name)
  }

  render() {
    return this.state.failed
      ? <p data-fixture-failed>Planner fixture error</p>
      : this.props.children
  }
}

function App() {
  const [props, setProps] = useState(harness.config.incomeProps)
  const Client = clients[harness.config.planner]
  useEffect(() => {
    harness.committed = true
    harness.updateIncomeProps = setProps
  }, [])
  return <Client {...props} />
}

createRoot(document.getElementById("root")).render(
  <StrictMode><Boundary><App /></Boundary></StrictMode>,
)
