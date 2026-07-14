# 资产看板 (Asset Tracker)

一个本地运行的个人资产管理与投资收益追踪 Web 应用，支持多币种、多用户、行情自动拉取、定投计划、专业指标分析。数据完全存储在本地，隐私安全。

## 核心特性

* **多资产类型**：股票、ETF、基金、债券、加密货币、现金、存款、房产等
* **多币种自动换算**：按用户基础币种统一展示
* **免费行情源**：东方财富（国内股票/基金/港股/美股）+ CoinGecko（加密货币）+ Frankfurter（汇率）
* **智能代码搜索**：输入"茅台""比特币""AAPL"自动联想匹配
* **定投计划**：支持每日/每周/每月定投，可指定资金来源（内部转账不虚增收益）
* **专业收益指标**：TWR 累计收益、XIRR 年化收益、夏普比率、索提诺比率、最大回撤
* **净值曲线**：每日快照绘制历史走势，Y 轴自适应缩放
* **调仓建议**：目标配置 vs 实际配置对比，给出买卖建议
* **分红管理**：单独记录股息、利息，纳入总收益计算
* **现金流管理**：区分外部流入（工资）和内部转账（余额宝→基金）

## 技术栈

* **框架**：Next.js 14 (App Router) + TypeScript
* **数据库**：Prisma ORM + SQLite（可切换到 PostgreSQL）
* **认证**：Auth.js v5 (Credentials + JWT)
* **图表**：Recharts
* **样式**：Tailwind CSS

## 目录结构

```
asset-tracker/
├── prisma/
│   └── schema.prisma          # 数据模型
├── scripts/
│   ├── daily-snapshot.ts      # 每日净值快照
│   └── fix-from-asset.ts      # 迁移脚本（旧计划补充资金来源）
├── install.bat / install.sh   # 一键安装脚本
├── start.bat / start.sh       # 一键启动脚本
└── src/
    ├── auth.ts                # Auth.js 配置
    ├── middleware.ts          # 路由鉴权
    ├── app/
    │   ├── page.tsx           # 首页：总资产、收益指标、净值曲线、类别分布
    │   ├── assets/            # 持仓列表与新增（代码智能联想）
    │   ├── plans/             # 定投计划管理
    │   ├── dividends/         # 分红记录
    │   ├── cashflow/          # 现金流记录
    │   ├── rebalance/         # 调仓建议
    │   ├── login/ register/   # 登录注册
    │   └── api/               # 后端 API
    │       ├── auth/          # 认证
    │       ├── register/      # 注册
    │       ├── assets/        # 资产 CRUD
    │       ├── transactions/  # 交易流水
    │       ├── plans/         # 定投计划（含执行、批量到期执行）
    │       ├── dividends/     # 分红
    │       ├── cashflow/      # 现金流
    │       ├── snapshot/      # 每日快照
    │       ├── search/        # 代码搜索（东方财富+CoinGecko）
    │       ├── quotes/        # 实时行情
    │       └── settings/      # 基础币种、目标配置
    ├── components/
    │   ├── Nav.tsx            # 顶部导航
    │   ├── NetWorthChart.tsx  # 净值曲线（自适应 Y 轴）
    │   ├── AllocationPie.tsx  # 资产分布饼图（百分比标签）
    │   ├── AssetForm.tsx      # 资产录入（代码联想）
    │   ├── AssetTable.tsx     # 持仓表格
    │   ├── CashFlowForm.tsx   # 现金流录入
    │   └── CashFlowTable.tsx  # 现金流列表
    └── lib/
        ├── prisma.ts          # Prisma 单例
        ├── quotes.ts          # 行情拉取（东方财富+CoinGecko，带缓存）
        ├── fx.ts              # 汇率（Frankfurter）
        ├── returns.ts         # XIRR 计算（Newton 迭代）
        ├── metrics.ts         # 组合指标（TWR、波动率、夏普、回撤等）
        ├── portfolio.ts       # 持仓聚合、快照生成
        ├── plan.ts            # 定投调度与执行（含资金来源扣款逻辑）
        ├── deposit.ts         # 存款利息计算（单利/复利）
        └── constants.ts       # 类别中文映射、币种、推断规则
```

## 数据模型

* **User**：账号、基础币种、目标配置、无风险利率
* **Asset**：资产持仓（含存款利率、起止日期、计息方式）
* **Transaction**：交易流水（BUY/SELL/DIVIDEND），自动更新持仓和平均成本
* **Dividend**：分红/利息记录
* **InvestmentPlan**：定投计划（含 `fromAssetId` 资金来源，区分外部转入 vs 内部转账）
* **CashFlow**：现金流（工资流入、消费流出）
* **Snapshot**：每日净值快照（含 netFlow 用于 TWR 计算）

## 关键概念

### 收益率区分

| 类型     | 是否计入投资收益     |
| ------ | ------------ |
| 工资进余额宝 | ❌ 外部流入       |
| 余额宝转基金 | ❌ 内部转账（只挪位置） |
| 基金涨跌   | ✅ 真投资收益      |
| 余额宝利息  | ✅ 真投资收益      |
| 分红/股息  | ✅ 真投资收益      |

* **TWR 累计收益率**：剔除外部现金流，只反映投资水平
* **XIRR 年化收益率**：考虑资金投入时间，真实资金回报率
* **简单收益率**：`(市值+分红-成本) / 成本`，参考用

### 定投资金来源

定投计划可选择：

* **外部转入**：不扣任何资产（比如工资直接买基金）
* **从某资产扣款**：内部转账（如余额宝定投基金，会自动扣减余额宝）

## 行情源

| 类型            | 数据源         | 说明              |
| ------------- | ----------- | --------------- |
| A 股 / 港股 / 美股 | 东方财富        | 免费、无需 Key、国内可访问 |
| 基金 / ETF / 债券 | 东方财富        | 覆盖国内公募基金        |
| 加密货币          | CoinGecko   | 免费、无需 Key       |
| 汇率            | Frankfurter | 欧央行数据           |

## 快速开始

### Windows 用户

1. 安装 [Node.js LTS](https://nodejs.org)（v18+）
2. 双击 `install.bat` 首次安装
3. 双击 `start.bat` 启动，浏览器自动打开 [http://localhost:3000](http://localhost:3000)
4. 注册账号后开始使用

### macOS / Linux 用户

```bash
./install.sh   # 首次安装
./start.sh     # 启动
```

### 手动安装（开发者）

```bash
npm install
cp .env.example .env
# 编辑 .env 填入 AUTH_SECRET (openssl rand -base64 32)
npx prisma db push
npx prisma generate
npm run dev
```

## 使用指南

### 录入资产

在"持仓"页输入代码或名称，系统自动联想：

| 输入                | 匹配       |
| ----------------- | -------- |
| `茅台` 或 `600519`   | 贵州茅台     |
| `苹果` 或 `AAPL`     | Apple    |
| `腾讯` 或 `00700`    | 腾讯控股     |
| `btc` 或 `bitcoin` | 比特币      |
| `沪深300`           | 相关基金/ETF |

现金/余额宝类：类别选"现金"或"存款"，代码可自定义。

### 定投配置

在"定投"页新建计划，选择：

* 目标资产
* **资金来源**（关键！）：

  * "外部转入"：工资直接买入
  * "从余额宝扣款"：内部转账，会同步扣减余额宝

### 生成快照

* 手动：持仓页点"生成今日快照"
* 自动：配合 cron 每日执行 `npm run snapshot`

## 部署

### 每日快照定时任务

**Windows 任务计划程序**：

```
每天 18:00 执行 npm run snapshot
```

**Linux/macOS cron**：

```
0 18 * * * cd /path/to/asset-tracker && npm run snapshot
```

**Vercel Cron**（如果部署到 Vercel）：

```
0 10 * * * → /api/plans/[id]/execute-due
```

### 分发给他人

打包（排除 node_modules 和 .next）：

```powershell
robocopy . _pack /E /XD node_modules .next .git /XF dev.db .env
Compress-Archive -Path _pack/* -DestinationPath asset-tracker.zip
```

对方解压后双击 `install.bat` 即可，不需要懂技术。

## 数据管理

* **位置**：所有数据保存在 `prisma/dev.db`
* **备份**：直接复制这个文件
* **迁移到新电脑**：整个项目文件夹拷过去
* **重置**：删掉 `dev.db`，重新 `npx prisma db push`

## 常见问题

**Q: 收益率一直显示 0.00%？**
需要至少 2 天的快照才能计算。手动点几次快照，或改电脑时间生成不同日期的快照。

**Q: 端口 3000 被占用？**
修改 `package.json` 的 `"dev": "next dev -p 3001"` 换端口。

**Q: 行情拉不到？**
检查网络能否访问东方财富和 CoinGecko。行情有 60 秒缓存，改完立即刷新看不到变化是正常的。

**Q: 数据安全吗？**
完全存本地，不上传任何服务器。只有查询行情时请求公开数据源。

## 后续规划

* 移动端（React Native/Flutter）复用同一套 API
* Docker 镜像分发
* Electron 打包成 exe
* Vercel 云部署（多端同步）
* 更精细的调仓方案（精确到具体标的的买卖数量）
* 定投历史图表分析

## License

MIT
