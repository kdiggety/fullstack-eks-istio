variable "region" { type = string }
variable "cluster_name" { type = string }
variable "tags" { type = map(string) default = { Project = "fullstack-sample" } }
