import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Upgrade plan | oLegal",
}

export default function UpgradePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:pb-16 md:pt-12">
      <div className="mb-4 flex items-center">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">Back</Link>
        </Button>
      </div>

      <div className="mb-6 text-center md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Upgrade your plan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Choose the plan that fits your workflow
        </p>

        <div className="mt-4 flex w-full justify-center">
          <Tabs defaultValue="personal">
            <TabsList className="grid w-[280px] grid-cols-2">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="business" disabled>
                Business
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <CardDescription>Intelligence for everyday tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">$0</span>
              <span className="text-muted-foreground text-xs">USD / month</span>
            </div>
            <Button className="w-full" variant="outline" disabled>
              Your current plan
            </Button>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Access to GPT-5",
                "Limited file uploads",
                "Limited and slower image generation",
                "Limited memory and context",
                "Limited deep research",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/40 relative ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Plus</CardTitle>
            <CardDescription>More access to advanced intelligence</CardDescription>
            <CardAction>
              <Badge>Popular</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">$20</span>
              <span className="text-muted-foreground text-xs">USD / month</span>
            </div>
            <Button className="w-full">Join Plus</Button>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "GPT-5 with advanced reasoning",
                "Expanded messaging and uploads",
                "Unlimited and faster image creation",
                "Expanded memory and context",
                "Expanded deep research and agent mode",
                "Projects, tasks, custom GPTs",
                "Sora video generation",
                "Codex agent",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center text-xs text-muted-foreground">
        Need more capabilities for your business?{" "}
        <Link href="#" className="underline underline-offset-4">
          Contact sales
        </Link>
      </div>
    </div>
  )
}


