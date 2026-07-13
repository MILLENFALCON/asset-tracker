# 资产看板 (Asset Tracker)

一个多用户的个人资产管理与收益追踪 Web 应用，支持多币种换算、行情自动拉取、每日净值快照和目标配置调仓建议。

## 技术栈

* **框架**：Next.js 14 (App Router) + TypeScript
* **数据库**：Prisma ORM + SQLite（可无缝切换 Postgres）
* **认证**：Auth.js v5 (Credentials + JWT Session)
* **行情源**：yahoo-finance2（覆盖美股/A股/港股/ETF/加密货币/外汇）
* **图表**：Recharts
* **样式**：Tailwind CSS

## 目录结构

```
asset-tracker/
├── prisma/
│   └── schema.prisma          # 数据模型：User / Asset / Transaction / Snapshot
├── scripts/
│   └── daily-snapshot.ts      # 每日净值快照脚本，配合 cron 使用
└── src/
    ├── auth.ts                # Auth.js 配置
    ├── middleware.ts          # 路由鉴权
    ├── app/
    │   ├── page.tsx           # 首页看板：总资产、收益率、净值曲线、类别分布
    │   ├── assets/            # 持仓列表与新增
    │   ├── rebalance/         # 调仓建议
    │   ├── login/ register/   # 登录注册
    │   └── api/               # 后端 API 路由
    │       ├── auth/          # 认证
    │       ├── register/      # 注册
    │       ├── assets/        # 资产 CRUD
    │       ├── transactions/  # 交易流水，自动更新持仓和平均成本
    │       ├── snapshot/      # 生成/查询每日快照
    │       ├── quotes/        # 单个行情查询
    │       └── settings/      # 基础币种与目标配置
    ├── components/
    │   ├── Nav.tsx            # 顶部导航
    │   ├── NetWorthChart.tsx  # 净值曲线图
    │   ├── AllocationPie.tsx  # 资产分布饼图
    │   └── AssetForm.tsx      # 资产录入表单
    └── lib/
        ├── prisma.ts          # Prisma 单例
        ├── quotes.ts          # 行情拉取 + 内存缓存 (60s TTL)
        ├── fx.ts              # 汇率换算 + 缓存 (1h TTL)，支持 USD 中转
        ├── returns.ts         # XIRR 计算 (资金加权年化收益率)
        └── portfolio.ts       # 组合汇总、快照生成核心逻辑
```

## 数据模型

* **User**：账号信息、基础币种 (`baseCurrency`)、目标配置 (`targetAlloc` JSON)
* **Asset**：单笔资产持仓，含代码、类别、币种、数量、平均成本
* **Transaction**：交易流水 (BUY/SELL/DIVIDEND)，写入时自动更新对应资产的持仓与平均成本
* **Snapshot**：每日净值快照，用于绘制净值曲线，按用户+日期唯一

## 功能模块

* **多用户**：邮箱+密码注册登录，数据按用户隔离
* **多币种**：每笔资产按自身币种记录，展示时统一换算到用户基础币种
* **行情自动拉取**：录入代码后自动获取现价，失败时回退到手工价或成本价
* **收益率统计**：单资产/整体的浮动盈亏、收益率百分比，可扩展 XIRR 年化
* **净值曲线**：手动触发或 cron 定时生成快照，历史走势可视化
* **调仓建议**：设定目标配置比例后，自动计算各类别的偏差和买卖金额建议

## 快速开始

```bash
npm install
cp .env.example .env          # 填入 AUTH_SECRET
npx prisma db push
npm run dev
```

访问 `http://localhost:3000/register` 注册使用。

## 部署与定时任务

* 部署：Vercel / 自建 Node 服务均可，生产环境建议切换到 Postgres
* 每日快照：`npm run snapshot`，配合系统 cron 或 Vercel Cron 每日执行一次

## 后续规划

* 移动端 (React Native/Flutter) 复用同一套 API
* A 股行情备用源（akshare / 新浪财经）
* 交易流水页面与 XIRR 年化收益展示
* 更精细的调仓方案（精确到具体标的的买卖数量）

---

需要的话我可以再帮你加个截图占位、License 段落或者中英双语版本。
